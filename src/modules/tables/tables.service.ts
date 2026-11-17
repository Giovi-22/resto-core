import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Table, TableStatus } from './entities/table.entity.js';
import { Zone } from '../zones/entities/zone.entity.js';
import { CreateTableDto } from './dto/create-table.dto.js';
import { UpdateTableDto } from './dto/update-table.dto.js';
import {
  ResourceNotFoundError,
  ConflictDomainError,
  UnprocessableError,
} from '../../common/errors/index.js';
import { AppLoggerService, LogEvent } from '../../common/logger/index.js';

@Injectable()
export class TablesService {
  constructor(
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    @InjectRepository(Zone)
    private readonly zoneRepository: Repository<Zone>,
    private readonly logger: AppLoggerService,
  ) {}

  async findAll(restaurantId: string, zoneId?: string): Promise<Table[]> {
    const where: FindOptionsWhere<Table> = { restaurantId };
    if (zoneId) {
      where.zoneId = zoneId;
    }

    return this.tableRepository.find({
      where,
      order: { number: 'ASC' },
      relations: { zone: true },
    });
  }

  async findOne(id: string, restaurantId: string): Promise<Table> {
    const table = await this.tableRepository.findOne({
      where: { id, restaurantId },
      relations: { zone: true },
    });

    if (!table) {
      throw new ResourceNotFoundError(
        `Mesa con id "${id}" no encontrada en este restaurante`,
        LogEvent.RESTAURANT,
      );
    }

    return table;
  }

  async create(restaurantId: string, dto: CreateTableDto): Promise<Table> {
    const existing = await this.tableRepository.findOne({
      where: { restaurantId, number: dto.number },
    });

    if (existing) {
      throw new ConflictDomainError(
        `Ya existe una mesa con el número ${dto.number} en este restaurante`,
        LogEvent.RESTAURANT,
      );
    }

    if (dto.zoneId) {
      const zone = await this.zoneRepository.findOne({
        where: { id: dto.zoneId, restaurantId, isActive: true },
      });
      if (!zone) {
        throw new ResourceNotFoundError(
          `Zona con id "${dto.zoneId}" no encontrada en este restaurante`,
          LogEvent.RESTAURANT,
        );
      }
    }

    const table = this.tableRepository.create({
      ...dto,
      restaurantId,
      status: TableStatus.AVAILABLE,
    });

    const saved = await this.tableRepository.save(table);
    this.logger.log(`Mesa creada: #${saved.number} (${saved.id})`, LogEvent.RESTAURANT, TablesService.name);
    return saved;
  }

  async update(id: string, restaurantId: string, dto: UpdateTableDto): Promise<Table> {
    const table = await this.findOne(id, restaurantId);

    if (dto.number && dto.number !== table.number) {
      const existing = await this.tableRepository.findOne({
        where: { restaurantId, number: dto.number },
      });
      if (existing) {
        throw new ConflictDomainError(
          `Ya existe una mesa con el número ${dto.number} en este restaurante`,
          LogEvent.RESTAURANT,
        );
      }
    }

    if (dto.zoneId && dto.zoneId !== table.zoneId) {
      const zone = await this.zoneRepository.findOne({
        where: { id: dto.zoneId, restaurantId, isActive: true },
      });
      if (!zone) {
        throw new ResourceNotFoundError(
          `Zona con id "${dto.zoneId}" no encontrada en este restaurante`,
          LogEvent.RESTAURANT,
        );
      }
    }

    Object.assign(table, dto);
    const updated = await this.tableRepository.save(table);

    this.logger.log(`Mesa actualizada: #${updated.number} (${updated.id})`, LogEvent.RESTAURANT, TablesService.name);
    return updated;
  }

  async updateStatus(
    id: string,
    restaurantId: string,
    status: TableStatus,
  ): Promise<Table> {
    const table = await this.findOne(id, restaurantId);
    table.status = status;
    const updated = await this.tableRepository.save(table);

    this.logger.log(
      `Estado de mesa #${table.number} cambiado a ${status}`,
      LogEvent.RESTAURANT,
      TablesService.name,
    );
    return updated;
  }

  async remove(id: string, restaurantId: string): Promise<void> {
    const table = await this.findOne(id, restaurantId);

    if (table.status === TableStatus.OCCUPIED) {
      throw new UnprocessableError(
        `No se puede eliminar la mesa #${table.number} porque se encuentra ocupada`,
      );
    }

    await this.tableRepository.remove(table);
    this.logger.log(`Mesa #${table.number} eliminada`, LogEvent.RESTAURANT, TablesService.name);
  }
}
