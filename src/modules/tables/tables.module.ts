import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TablesController } from './tables.controller.js';
import { TablesService } from './tables.service.js';
import { Table } from './entities/table.entity.js';
import { Zone } from '../zones/entities/zone.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Table, Zone])],
  controllers: [TablesController],
  providers: [TablesService],
  exports: [TablesService, TypeOrmModule],
})
export class TablesModule {}

