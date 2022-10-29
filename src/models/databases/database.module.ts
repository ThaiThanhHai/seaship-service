import { Module } from '@nestjs/common';
import { databaseProviders } from './database.porvider';

@Module({
  providers: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DatabaseModule {}
