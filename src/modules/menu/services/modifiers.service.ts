import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ModifierGroup } from '../entities/modifier-group.entity.js';
import { Modifier } from '../entities/modifier.entity.js';
import { Product } from '../entities/product.entity.js';
import { CreateModifierGroupDto } from '../dto/create-modifier-group.dto.js';
import { UpdateModifierGroupDto } from '../dto/update-modifier-group.dto.js';
import { CreateModifierDto } from '../dto/create-modifier.dto.js';
import { UpdateModifierDto } from '../dto/update-modifier.dto.js';
import { ResourceNotFoundError } from '../../../common/errors/index.js';
import { AppLoggerService, LogEvent } from '../../../common/logger/index.js';

@Injectable()
export class ModifiersService {
  constructor(
    @InjectRepository(ModifierGroup)
    private readonly groupRepository: Repository<ModifierGroup>,
    @InjectRepository(Modifier)
    private readonly modifierRepository: Repository<Modifier>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly logger: AppLoggerService,
  ) {}

  async createGroup(
    productId: string,
    restaurantId: string,
    dto: CreateModifierGroupDto,
  ): Promise<ModifierGroup> {
    const product = await this.productRepository.findOne({
      where: { id: productId, restaurantId },
    });

    if (!product) {
      throw new ResourceNotFoundError(
        `Producto con id "${productId}" no encontrado en este restaurante`,
        LogEvent.RESTAURANT,
      );
    }

    const group = this.groupRepository.create({
      ...dto,
      productId,
    });

    const saved = await this.groupRepository.save(group);
    this.logger.log(`Grupo de modificadores creado: ${saved.name}`, LogEvent.RESTAURANT, ModifiersService.name);
    return saved;
  }

  async updateGroup(
    groupId: string,
    restaurantId: string,
    dto: UpdateModifierGroupDto,
  ): Promise<ModifierGroup> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: { product: true },
    });

    if (!group || group.product?.restaurantId !== restaurantId) {
      throw new ResourceNotFoundError(
        `Grupo de modificadores "${groupId}" no encontrado en este restaurante`,
        LogEvent.RESTAURANT,
      );
    }

    Object.assign(group, dto);
    const updated = await this.groupRepository.save(group);

    this.logger.log(`Grupo de modificadores actualizado: ${updated.id}`, LogEvent.RESTAURANT, ModifiersService.name);
    return updated;
  }

  async removeGroup(groupId: string, restaurantId: string): Promise<void> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: { product: true },
    });

    if (!group || group.product?.restaurantId !== restaurantId) {
      throw new ResourceNotFoundError(
        `Grupo de modificadores "${groupId}" no encontrado en este restaurante`,
        LogEvent.RESTAURANT,
      );
    }

    await this.groupRepository.remove(group);
    this.logger.log(`Grupo de modificadores eliminado: ${groupId}`, LogEvent.RESTAURANT, ModifiersService.name);
  }

  async createModifier(
    groupId: string,
    restaurantId: string,
    dto: CreateModifierDto,
  ): Promise<Modifier> {
    const group = await this.groupRepository.findOne({
      where: { id: groupId },
      relations: { product: true },
    });

    if (!group || group.product?.restaurantId !== restaurantId) {
      throw new ResourceNotFoundError(
        `Grupo de modificadores "${groupId}" no encontrado en este restaurante`,
        LogEvent.RESTAURANT,
      );
    }

    const modifier = this.modifierRepository.create({
      ...dto,
      modifierGroupId: groupId,
    });

    const saved = await this.modifierRepository.save(modifier);
    this.logger.log(`Modificador creado: ${saved.name}`, LogEvent.RESTAURANT, ModifiersService.name);
    return saved;
  }

  async updateModifier(
    modifierId: string,
    restaurantId: string,
    dto: UpdateModifierDto,
  ): Promise<Modifier> {
    const modifier = await this.modifierRepository.findOne({
      where: { id: modifierId },
      relations: { modifierGroup: { product: true } },
    });

    if (!modifier || modifier.modifierGroup?.product?.restaurantId !== restaurantId) {
      throw new ResourceNotFoundError(
        `Modificador "${modifierId}" no encontrado en este restaurante`,
        LogEvent.RESTAURANT,
      );
    }

    Object.assign(modifier, dto);
    const updated = await this.modifierRepository.save(modifier);

    this.logger.log(`Modificador actualizado: ${updated.id}`, LogEvent.RESTAURANT, ModifiersService.name);
    return updated;
  }

  async removeModifier(modifierId: string, restaurantId: string): Promise<void> {
    const modifier = await this.modifierRepository.findOne({
      where: { id: modifierId },
      relations: { modifierGroup: { product: true } },
    });

    if (!modifier || modifier.modifierGroup?.product?.restaurantId !== restaurantId) {
      throw new ResourceNotFoundError(
        `Modificador "${modifierId}" no encontrado en este restaurante`,
        LogEvent.RESTAURANT,
      );
    }

    await this.modifierRepository.remove(modifier);
    this.logger.log(`Modificador eliminado: ${modifierId}`, LogEvent.RESTAURANT, ModifiersService.name);
  }
}
