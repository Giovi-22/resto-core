import { LogEvent } from '../logger/log-event.enum.js';

/**
 * Clase base para todos los errores de aplicación.
 *
 * Subclases deben declarar `statusCode` y `logEvent`.
 * El `AllExceptionsFilter` los detecta y los loguea con la categoría correcta
 * sin necesidad de try/catch intermedios.
 *
 * @example
 * throw new ResourceNotFoundError('Restaurante no encontrado', LogEvent.RESTAURANT);
 */
export abstract class AppError extends Error {
  /** Código HTTP que se devuelve al cliente */
  abstract readonly statusCode: number;

  /** Categoría de log — qué "dominio" generó el error */
  abstract readonly logEvent: LogEvent;

  /** Severidad de log. Por defecto warn; los errores de infra usan error. */
  readonly logLevel: 'error' | 'warn' = 'warn';

  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = this.constructor.name;
    // Mantiene el stack correcto en V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

