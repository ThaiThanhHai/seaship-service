import { DeliveryService } from 'src/services/delivery.service';
import { DeliveryController } from './controllers/delivery.controller';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OrderController } from './controllers/order.controller';
import { DeliveryTypeController } from './controllers/delivery-type.controller';
import { OrderService } from './services/order.service';
import { DeliveryTypeService } from './services/delivery-type.service';
import { PythonService } from './services/python.service';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ShipperController } from './controllers/shipper.controller';
import { ShipperService } from './services/shipper.service';
import { PythonController } from './controllers/python.controller';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../resources'),
      serveRoot: '/resources',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: () => ({
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        username: 'root',
        password: 'password',
        database: 'seaship_dev',
        entities: [`dist/models/*{.ts,.js}`],
        synchronize: true,
      }),
    }),
    HttpModule,
  ],
  controllers: [
    AppController,
    DeliveryTypeController,
    OrderController,
    ShipperController,
    DeliveryController,
    PythonController,
    AuthController,
  ],
  providers: [
    AppService,
    DeliveryTypeService,
    OrderService,
    PythonService,
    ShipperService,
    DeliveryService,
    AuthService,
  ],
})
export class AppModule {}
