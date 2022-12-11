import { Supervisor } from './../models/supervisor.entity';
import { DeliveryType } from './../models/delivery-type.entity';
import { OrderAddress } from './../models/order-address.entity';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Repository, DataSource, In, LessThan } from 'typeorm';
import { Order, Status } from '../models/order.entity';
import {
  OrderDto,
  CargoDto,
  OrderAddressDto,
} from '../controllers/dto/order.dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { Cargo } from 'src/models/cargo.entity';
import { isArray } from 'lodash';
import { lastValueFrom, map } from 'rxjs';
import { HttpService } from '@nestjs/axios/dist';
import { round } from 'lodash';
import { Base64Str } from 'src/controllers/dto/base64.dto';
import * as fileType from 'file-type';
import * as path from 'path';
import { Buffer } from 'buffer';
import { promises } from 'fs';
import { uuid } from 'uuidv4';
import * as XLSX from 'xlsx';

@Injectable()
export class OrderService {
  private latDepot = 10.03010273;
  private lngDepot = 105.770626025;
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
    private httpService: HttpService,
  ) {}

  private async getDeliveryTypeById(
    id: number,
    deliveryTypeRepository: Repository<DeliveryType>,
  ) {
    const firstDeliveryType = await deliveryTypeRepository.findOneBy({ id });

    if (!firstDeliveryType) {
      throw new BadRequestException('The delivery type id not found');
    }

    return firstDeliveryType;
  }

  private async getSupervisorById(
    id: number,
    supervisorRepository: Repository<Supervisor>,
  ) {
    const supervisor = await supervisorRepository.findOneBy({ id });

    if (!supervisor) {
      throw new BadRequestException('The supervisor id not found');
    }

    return supervisor;
  }

  private async createCargo(
    cargoDto: CargoDto,
    cargoRepository: Repository<Cargo>,
  ) {
    const cargoEntity = new Cargo();
    cargoEntity.name = cargoDto.name;
    cargoEntity.weight = cargoDto.weight;
    cargoEntity.dimension = cargoDto.dimension;

    const createdCargo = await cargoRepository.save(cargoEntity);

    return createdCargo;
  }

  private async createOrderAddress(
    orderAddressDto: OrderAddressDto,
    orderAddressRepository: Repository<OrderAddress>,
  ) {
    const orderAddressEntity = new OrderAddress();
    orderAddressEntity.address = orderAddressDto.address;
    orderAddressEntity.longitude = orderAddressDto.longitude;
    orderAddressEntity.latitude = orderAddressDto.latitude;
    orderAddressEntity.distance = orderAddressDto.distance;

    const createdOrderAddress = orderAddressRepository.save(orderAddressEntity);

    return createdOrderAddress;
  }

  private parseDeliveryTime(numberDay: number) {
    const today = new Date();
    const deliveryTime = new Date(today.setDate(today.getDate() + numberDay));

    return deliveryTime;
  }

  private async getCoordinates(adđress: string) {
    const requestConfig = {
      maxBodyLength: Infinity,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const value = encodeURI(adđress);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${value}.json?access_token=pk.eyJ1IjoidGhhaXRoYW5oaGFpIiwiYSI6ImNsOGVwZ2s0bjBpdWQzdnA5c3U5NmVoM3IifQ.h7reW0CjFKe-waithRjc0g`;
    const media = this.httpService.get(url, requestConfig);
    const response = media.pipe(
      map((res) => {
        return res.data;
      }),
    );
    const result = await lastValueFrom(response);

    return result;
  }

  pasreEncodeURI(address) {
    const newAddress = address.map((data) => {
      return `${data.lng}%2C${data.lat}`;
    });
    return newAddress.join('%3B');
  }

  async getDistance(address) {
    const requestConfig = {
      maxBodyLength: Infinity,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    const coordinates = this.pasreEncodeURI(address);
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coordinates}?alternatives=false&geometries=geojson&language=en&overview=simplified&steps=true&access_token=pk.eyJ1IjoidGhhaXRoYW5oaGFpIiwiYSI6ImNsOGVwZ2s0bjBpdWQzdnA5c3U5NmVoM3IifQ.h7reW0CjFKe-waithRjc0g`;
    const media = this.httpService.get(url, requestConfig);
    const response = media.pipe(
      map((res) => {
        return res.data;
      }),
    );
    const result = await lastValueFrom(response);

    return round(result.routes[0].distance / 1000, 2);
  }

  computeShippingFee(
    weight: number,
    address: string,
    deliveryType: DeliveryType,
  ) {
    let price = 0;
    if (address.includes('Ninh Kiều') || address.includes('Ninh Kieu')) {
      if (weight < 3) {
        price = deliveryType.price_inner;
      } else {
        price =
          (weight - 3) * deliveryType.overpriced + deliveryType.price_inner;
      }
    } else {
      if (weight < 3) {
        price = deliveryType.price_outer;
      } else {
        price =
          (weight - 3) * deliveryType.overpriced + deliveryType.price_outer;
      }
    }

    return price;
  }

  async createdOrder(orderDto: OrderDto) {
    const coordinates = await this.getCoordinates(
      orderDto.order_address.address,
    );
    orderDto.order_address.longitude = coordinates.features[0].center[0];
    orderDto.order_address.latitude = coordinates.features[0].center[1];
    const coordinatesDistance = [
      { lng: this.lngDepot, lat: this.latDepot },
      {
        lng: orderDto.order_address.longitude,
        lat: orderDto.order_address.latitude,
      },
    ];

    orderDto.order_address.distance = await this.getDistance(
      coordinatesDistance,
    );

    const createdOrder = await this.dataSource.transaction(async (manager) => {
      const orderRepository = manager.getRepository(Order);
      const deliveryTypeRepository = manager.getRepository(DeliveryType);
      const cargoRepository = manager.getRepository(Cargo);
      const orderAddressRepository = manager.getRepository(OrderAddress);
      const supervisorRepository = manager.getRepository(Supervisor);

      const deliveryType = await this.getDeliveryTypeById(
        orderDto.delivery_type_id,
        deliveryTypeRepository,
      );

      orderDto.shipping_fee = this.computeShippingFee(
        orderDto.cargo.weight,
        orderDto.order_address.address,
        deliveryType,
      );

      const supervisor = await this.getSupervisorById(
        orderDto.supervisor_id,
        supervisorRepository,
      );

      const createdCargo = await this.createCargo(
        orderDto.cargo,
        cargoRepository,
      );

      const createdOrderAddress = await this.createOrderAddress(
        orderDto.order_address,
        orderAddressRepository,
      );

      const orderEntity = new Order();
      orderEntity.sender_name = orderDto.sender_name;
      orderEntity.sender_phone = orderDto.sender_phone;
      orderEntity.receiver_name = orderDto.receiver_name;
      orderEntity.receiver_phone = orderDto.receiver_phone;
      orderEntity.shipping_fee = orderDto.shipping_fee;
      orderEntity.note = orderDto.note;
      orderEntity.delivery_type = deliveryType;
      orderEntity.supervisor = supervisor;
      orderEntity.cargo = createdCargo;
      orderEntity.order_address = createdOrderAddress;
      orderEntity.delivery_time = this.parseDeliveryTime(
        deliveryType.delivery_days,
      );

      const createdOrder = await orderRepository.save(orderEntity);

      return createdOrder;
    });
    return createdOrder;
  }

  async createFileExcel(data: string) {
    const buf = Buffer.from(data, 'base64');
    const type = await fileType.fromBuffer(buf);
    const fileName = uuid();

    const filePath = path.join(
      __dirname,
      `../../resources/${fileName}.${type.ext}`,
    );

    await promises.writeFile(filePath, buf);

    return filePath;
  }

  async createOrderByFileExcel(base64Str: Base64Str) {
    const url = await this.createFileExcel(base64Str.data);

    const workbook = XLSX.readFile(url);

    const data = [];

    const sheets = workbook.SheetNames;

    for (let i = 0; i < sheets.length; i++) {
      const temp = XLSX.utils.sheet_to_json(
        workbook.Sheets[workbook.SheetNames[i]],
        { range: 1 },
      );

      temp.forEach((res) => {
        data.push(res);
      });
    }
    const deliveryTypeRepository =
      this.dataSource.manager.getRepository(DeliveryType);

    const values =
      data &&
      Promise.all(
        data.map(async (item) => {
          const dimensions = item['Trọng lượng vận chuyển']
            .toString()
            .split('x');

          if (
            dimensions.length !== 3 ||
            isNaN(Number(dimensions[0])) ||
            isNaN(Number(dimensions[1])) ||
            isNaN(Number(dimensions[2]))
          ) {
            throw new BadRequestException(
              'Dimensions must be chieudai x chieurong x chieucao',
            );
          }
          const dimension = round(
            (dimensions[0] * dimensions[1] * dimensions[2]) / 6000,
            2,
          );

          const deliveryType = await deliveryTypeRepository.findOne({
            where: {
              name: item['Hình thức vận chuyển'],
            },
          });

          if (!deliveryType) {
            throw new BadRequestException('Not found delivery type');
          }

          const coordinates = await this.getCoordinates(
            item['Địa chỉ giao hàng'],
          );
          const coordinatesDistance = [
            { lng: this.lngDepot, lat: this.latDepot },
            {
              lng: coordinates.features[0].center[0],
              lat: coordinates.features[0].center[1],
            },
          ];
          const res = {
            sender_name: item['Tên người gửi'],
            sender_phone: `0${item['SĐT người gửi']}`,
            receiver_name: item['Tên người nhận'],
            receiver_phone: `0${item['SĐT người nhận']}`,
            shipping_fee: this.computeShippingFee(
              dimension,
              item['Địa chỉ giao hàng'],
              deliveryType,
            ),
            note: item['Ghi chú'],
            delivery_type_id: deliveryType.id,
            supervisor_id: base64Str.supervisor_id,
            cargo: {
              name: item['Tên đơn hàng'] as string,
              dimension: dimension,
              weight: item['Trọng lượng thực tế'] as number,
            } as CargoDto,
            order_address: {
              address: item['Địa chỉ giao hàng'],
              longitude: coordinates.features[0].center[0],
              latitude: coordinates.features[0].center[1],
              distance: await this.getDistance(coordinatesDistance),
            } as OrderAddressDto,
          };
          return res;
        }),
      );

    const createdOrders =
      values &&
      Promise.all(
        (await values).map(async (value) => {
          const createdOrder = await this.dataSource.transaction(
            async (manager) => {
              const orderRepository = manager.getRepository(Order);
              const deliveryTypeRepository =
                manager.getRepository(DeliveryType);
              const cargoRepository = manager.getRepository(Cargo);
              const orderAddressRepository =
                manager.getRepository(OrderAddress);
              const supervisorRepository = manager.getRepository(Supervisor);

              const deliveryType = await this.getDeliveryTypeById(
                value.delivery_type_id,
                deliveryTypeRepository,
              );

              value.shipping_fee = this.computeShippingFee(
                value.cargo.weight,
                value.order_address.address,
                deliveryType,
              );

              const supervisor = await this.getSupervisorById(
                value.supervisor_id,
                supervisorRepository,
              );

              const createdCargo = await this.createCargo(
                value.cargo,
                cargoRepository,
              );

              const createdOrderAddress = await this.createOrderAddress(
                value.order_address,
                orderAddressRepository,
              );

              const orderEntity = new Order();
              orderEntity.sender_name = value.sender_name;
              orderEntity.sender_phone = value.sender_phone;
              orderEntity.receiver_name = value.receiver_name;
              orderEntity.receiver_phone = value.receiver_phone;
              orderEntity.shipping_fee = value.shipping_fee;
              orderEntity.note = value.note;
              orderEntity.delivery_type = deliveryType;
              orderEntity.supervisor = supervisor;
              orderEntity.cargo = createdCargo;
              orderEntity.order_address = createdOrderAddress;
              orderEntity.delivery_time = this.parseDeliveryTime(
                deliveryType.delivery_days,
              );

              const createdOrder = await orderRepository.save(orderEntity);

              return createdOrder;
            },
          );
          return createdOrder;
        }),
      );

    return createdOrders;
  }

  async getListOfOrder(filter: Status[]) {
    let filterValue = filter;
    if (!isArray(filter)) {
      filterValue = [filter];
    }
    const page = 0;
    const limit = 100;
    const orderRepository = this.dataSource.manager.getRepository(Order);
    const [listOfOrders, count] = await orderRepository.findAndCount({
      where: {
        status: filter ? In(filterValue) : undefined,
      },
      relations: ['order_address', 'cargo'],
      order: {
        created_at: 'DESC',
      },
      skip: page,
      take: limit,
    });

    return {
      page: page,
      limit: limit,
      total: count,
      orders: listOfOrders,
    };
  }

  async getListOfOrderForTruck(filter: Status[]) {
    let filterValue = filter;
    if (!isArray(filter)) {
      filterValue = [filter];
    }
    const page = 0;
    const limit = 10;
    const orderRepository = this.dataSource.manager.getRepository(Order);
    const [listOfOrders, count] = await orderRepository.findAndCount({
      where: {
        status: filter ? In(filterValue) : undefined,
        cargo: {
          dimension: LessThan(1360),
          weight: LessThan(1000),
        },
      },
      relations: ['order_address', 'cargo'],
      order: {
        created_at: 'DESC',
      },
      skip: page,
      take: limit,
    });

    return {
      page: page,
      limit: limit,
      total: count,
      orders: listOfOrders,
    };
  }

  async getListOfOrderForMotorBike(filter: Status[]) {
    let filterValue = filter;
    if (!isArray(filter)) {
      filterValue = [filter];
    }
    const page = 0;
    const limit = 10;
    const orderRepository = this.dataSource.manager.getRepository(Order);
    const [listOfOrders, count] = await orderRepository.findAndCount({
      where: {
        status: filter ? In(filterValue) : undefined,
        cargo: {
          dimension: LessThan(56),
          weight: LessThan(20),
        },
      },
      relations: ['order_address', 'cargo'],
      order: {
        created_at: 'DESC',
      },
      skip: page,
      take: limit,
    });

    return {
      page: page,
      limit: limit,
      total: count,
      orders: listOfOrders,
    };
  }

  async getOrderById(id: number) {
    const orderRepository = this.dataSource.manager.getRepository(Order);

    const order = await orderRepository.findOne({
      where: { id: id },
      relations: ['order_address', 'cargo'],
    });

    if (!order) {
      throw new NotFoundException('The order id not found');
    }

    return order;
  }

  async deleteOrder(ids: Array<number>) {
    const createdListofOrder = await this.dataSource.transaction(
      async (manager) => {
        const orderRepository = manager.getRepository(Order);

        Promise.all(
          ids.map(async (id) => {
            const deleteResponse = await orderRepository.softDelete(id);
            if (!deleteResponse.affected) {
              throw new BadRequestException('Not found');
            }
          }),
        );
      },
    );
    return createdListofOrder;
  }
}
