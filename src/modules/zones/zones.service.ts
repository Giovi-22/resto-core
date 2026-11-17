import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Zone } from './entities/zone.entity.js';
import { CreateZoneDto } from './dto/create-zone.dto.js';
import { UpdateZoneDto } from './dto/update-zone.dto.js';
import { ResourceNotFoundError } from '../../common/errors/index.js';
import { AppLoggerService, LogEvent } from '../../common/logger/index.js';

@Injectable()
export class ZonesService {
  constructor(
    @InjectRepository(Zone)
    private readonly zoneRepository: Repository<Zone>,
    private readonly logger: AppLoggerService,
  ) {}

  async findAll(restaurantId: string): Promise<Zone[]> {
    return this.zoneRepository.find({
      where: { restaurantId, isActive: true },
      order: { name: 'ASC' },
      relations: { tables: true },
    });
  }

  async findOne(id: string, restaurantId: string): Promise<Zone> {
    const zone = await this.zoneRepository.findOne({
      where: { id, restaurantId },
      relations: { tables: true },
    });

    if (!zone) {
      throw new ResourceNotFoundError(
        `Zona con id "${id}" no encontrada en este restaurante`,
        LogEvent.RESTAURANT,
      );
    }

    return zone;
  }

  async create(restaurantId: string, dto: CreateZoneDto): Promise<Zone> {
    const zone = this.zoneRepository.create({
      ...dto,
      restaurantId,
    });

    const saved = await this.zoneRepository.save(zone);
    this.logger.log(`Zona creada: ${saved.name} (${saved.id})`, LogEvent.RESTAURANT, ZonesService.name);
    return saved;
  }

  async update(id: string, restaurantId: string, dto: UpdateZoneDto): Promise<Zone> {
    const zone = await this.findOne(id, restaurantId);

    Object.assign(zone, dto);
    const updated = await this.zoneRepository.save(zone);

    this.logger.log(`Zona actualizada: ${updated.id}`, LogEvent.RESTAURANT, ZonesService.name);
    return updated;
  }

  async remove(id: string, restaurantId: string): Promise<void> {
    const zone = await this.findOne(id, restaurantId);
    zone.isActive = false;
    await this.zoneRepository.save(zone);

    this.logger.log(`Zona desactivada: ${id}`, LogEvent.RESTAURANT, ZonesService.name);
  }
}
