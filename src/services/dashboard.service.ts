import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Delivery } from 'src/models/delivery.entity';
import { Order } from 'src/models/order.entity';
import { round, sum, uniqBy } from 'lodash';
import { Shipper } from 'src/models/shipper.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectDataSource()
    private dataSource: DataSource,
  ) {}

  async getDataStatistic() {
    const deliveryRepository = this.dataSource.manager.getRepository(Delivery);
    const orderRepository = this.dataSource.manager.getRepository(Order);
    const shipperRepository = this.dataSource.manager.getRepository(Shipper);

    const [orders, totalOrder] = await orderRepository.findAndCount();
    const deliveries = await deliveryRepository.find({
      relations: ['order'],
    });

    const distance = sum(
      uniqBy(deliveries, (e) => e.distance).map((e) => e.distance),
    );

    const dimension = sum(
      uniqBy(deliveries, (e) => e.dimension).map((e) => e.dimension),
    );

    const fee = sum(deliveries.map((e) => e.order.shipping_fee));

    const totalOrderSuccess = sum(orders.map((e) => e.status === 'finished'));
    const totalOrderFailure = sum(orders.map((e) => e.status === 'error'));
    const totalOrderDelivering = sum(
      orders.map((e) => e.status === 'delivering'),
    );

    const shippers = await shipperRepository.find({
      relations: ['delivery', 'delivery.order'],
    });

    const shipperData = [];
    shippers.forEach((shipper) => {
      const name = shipper.name;
      let shipperOrderSuccess = 0;
      let shipperOrderFailure = 0;
      let shipperOrderDelivering = 0;
      shipper.delivery.forEach((data) => {
        if (data.order.status === 'finished') {
          shipperOrderSuccess++;
        }
        if (data.order.status === 'error') {
          shipperOrderFailure++;
        }
        if (data.order.status === 'delivering') {
          shipperOrderDelivering++;
        }
      });

      shipperData.push({
        name: name,
        success: shipperOrderSuccess,
        failure: shipperOrderFailure,
        delivering: shipperOrderDelivering,
      });
    });

    const response = {
      totalOrder: totalOrder,
      totalDistance: distance,
      totalDimension: round(dimension, 1),
      totalFee: fee,
      totalOrderSuccess: totalOrderSuccess,
      totalOrderFailure: totalOrderFailure,
      totalOrderDelivering: totalOrderDelivering,
      shippers: shipperData,
    };

    return response;
  }
}
