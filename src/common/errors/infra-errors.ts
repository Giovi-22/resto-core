import { HttpStatus } from '@nestjs/common';
import { LogEvent } from '../logger/log-event.enum.js';
import { AppError } from './app-error.js';

/**
 * Error de base de datos no controlado (query fallida, conexión caída, etc.).
 * Siempre loguea con LogEvent.DATABASE y stack completo.
 * → HTTP 500
 *
 * Usar para envolver errores de TypeORM cuando se necesita contexto extra:
 * @example
 * try {
 *   await this.repo.save(entity);
 * } catch (err) {
 *   throw new DatabaseError('No se pudo guardar el restaurante', err as Error);
 * }
 */
export class DatabaseError extends AppError {
  readonly statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
  readonly logEvent   = LogEvent.DATABASE;
  readonly logLevel   = 'error' as const;

  constructor(message: string, cause?: Error) {
    super(message, { cause });
  }
}

/**
 * Servicio externo no disponible o con respuesta inesperada.
 * → HTTP 502 Bad Gateway
 *
 * @example
 * throw new ExternalServiceError('Fallo al llamar al proveedor de pagos', 'Stripe', err);
 */
export class ExternalServiceError extends AppError {
  readonly statusCode = HttpStatus.BAD_GATEWAY;
  readonly logEvent   = LogEvent.SYSTEM;
  readonly logLevel   = 'error' as const;

  constructor(
    message: string,
    /** Nombre del servicio externo, aparece en el log */
    readonly service: string,
    cause?: Error,
  ) {
    super(`[${service}] ${message}`, { cause });
  }
}

