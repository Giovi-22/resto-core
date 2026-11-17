import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { ZonesService } from './zones.service.js';
import { CreateZoneDto } from './dto/create-zone.dto.js';
import { UpdateZoneDto } from './dto/update-zone.dto.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../users/entities/user.entity.js';

@ApiTags('Zones')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('restaurants/:restaurantId/zones')
export class ZonesController {
  constructor(private readonly zonesService: ZonesService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Crear una nueva zona para el restaurante' })
  @ApiResponse({ status: 201, description: 'Zona creada' })
  create(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() dto: CreateZoneDto,
  ) {
    return this.zonesService.create(restaurantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las zonas activas del restaurante' })
  findAll(@Param('restaurantId', ParseUUIDPipe) restaurantId: string) {
    return this.zonesService.findAll(restaurantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una zona' })
  @ApiResponse({ status: 404, description: 'Zona no encontrada' })
  findOne(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.zonesService.findOne(id, restaurantId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Actualizar una zona' })
  update(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateZoneDto,
  ) {
    return this.zonesService.update(id, restaurantId, dto);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactivar una zona (soft delete)' })
  remove(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.zonesService.remove(id, restaurantId);
  }
}

