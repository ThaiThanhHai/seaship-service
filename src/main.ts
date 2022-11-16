import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use(bodyParser.json({ limit: '128mb' }));
  app.use(
    bodyParser.urlencoded({
      limit: '128mb',
      extended: true,
    }),
  );
  app.setGlobalPrefix('/api/v1');
  await app.listen(3000);
}
bootstrap();
