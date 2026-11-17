import { HttpStatus } from '@nestjs/common';
import { LogEvent } from '../logger/log-event.enum.js';
import { AppError } from './app-error.js';

/**
 * Credenciales inválidas o sesión no autenticada.
 * → HTTP 401, siempre loguea como SECURITY
 *
 * @example
 * throw new UnauthorizedError('Credenciales inválidas');
 */
export class UnauthorizedError extends AppError {
  readonly statusCode = HttpStatus.UNAUTHORIZED;
  readonly logEvent   = LogEvent.SECURITY;
  readonly logLevel   = 'warn' as const;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/**
 * Entidad no encontrada en base de datos.
 * → HTTP 404
 *
 * @example
 * throw new ResourceNotFoundError('Restaurante no encontrado', LogEvent.RESTAURANT);
 */
export class ResourceNotFoundError extends AppError {
  readonly statusCode = HttpStatus.NOT_FOUND;
  readonly logLevel   = 'warn' as const;

  constructor(
    message: string,
    readonly logEvent: LogEvent = LogEvent.SYSTEM,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

/**
 * Regla de negocio violada: duplicado, slug en uso, estado inválido, etc.
 * → HTTP 409
 *
 * @example
 * throw new ConflictDomainError('El slug ya está en uso', LogEvent.RESTAURANT);
 */
export class ConflictDomainError extends AppError {
  readonly statusCode = HttpStatus.CONFLICT;
  readonly logLevel   = 'warn' as const;

  constructor(
    message: string,
    readonly logEvent: LogEvent = LogEvent.SYSTEM,
    options?: ErrorOptions,
  ) {
    super(message, options);
  }
}

/**
 * Acción prohibida por regla de negocio (no confundir con 401 de JWT).
 * → HTTP 403, siempre loguea como SECURITY
 *
 * @example
 * throw new ForbiddenDomainError('Solo el dueño puede modificar este restaurante');
 */
export class ForbiddenDomainError extends AppError {
  readonly statusCode = HttpStatus.FORBIDDEN;
  readonly logEvent   = LogEvent.SECURITY;
  readonly logLevel   = 'warn' as const;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

/**
 * Validación de dominio fallida — más allá de la validación de DTO.
 * Usar cuando la combinación de valores es inválida por reglas de negocio.
 * → HTTP 422
 *
 * @example
 * throw new UnprocessableError('La fecha de cierre no puede ser anterior a la de apertura');
 */
export class UnprocessableError extends AppError {
  readonly statusCode = HttpStatus.UNPROCESSABLE_ENTITY;
  readonly logEvent   = LogEvent.VALIDATION;
  readonly logLevel   = 'warn' as const;

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

