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
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { TablesService } from './tables.service.js';
import { CreateTableDto } from './dto/create-table.dto.js';
import { UpdateTableDto } from './dto/update-table.dto.js';
import { UpdateTableStatusDto } from './dto/update-table-status.dto.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RolesGuard } from '../../common/guards/roles.guard.js';
import { UserRole } from '../users/entities/user.entity.js';

@ApiTags('Tables')
@ApiBearerAuth()
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('restaurants/:restaurantId/tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Post()
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Crear una nueva mesa en el restaurante' })
  @ApiResponse({ status: 201, description: 'Mesa creada' })
  create(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Body() dto: CreateTableDto,
  ) {
    return this.tablesService.create(restaurantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas las mesas del restaurante' })
  @ApiQuery({ name: 'zoneId', required: false, description: 'Filtrar mesas por zona' })
  findAll(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Query('zoneId') zoneId?: string,
  ) {
    return this.tablesService.findAll(restaurantId, zoneId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de una mesa' })
  @ApiResponse({ status: 404, description: 'Mesa no encontrada' })
  findOne(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tablesService.findOne(id, restaurantId);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.MANAGER)
  @ApiOperation({ summary: 'Actualizar datos de una mesa' })
  update(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTableDto,
  ) {
    return this.tablesService.update(id, restaurantId, dto);
  }

  @Patch(':id/status')
  @Roles(UserRole.WAITER, UserRole.MANAGER, UserRole.OWNER)
  @ApiOperation({ summary: 'Actualizar el estado de una mesa (libre, ocupada, etc.)' })
  updateStatus(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTableStatusDto,
  ) {
    return this.tablesService.updateStatus(id, restaurantId, dto.status);
  }

  @Delete(':id')
  @Roles(UserRole.OWNER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una mesa (solo si no está ocupada)' })
  remove(
    @Param('restaurantId', ParseUUIDPipe) restaurantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tablesService.remove(id, restaurantId);
  }
}

