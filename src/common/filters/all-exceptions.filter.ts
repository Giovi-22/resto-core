import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';
import { AppLoggerService } from '../logger/index.js';
import { LogEvent } from '../logger/log-event.enum.js';
import { AppError } from '../errors/app-error.js';

interface ErrorResponse {
  statusCode: number;
  timestamp:  string;
  path:       string;
  method:     string;
  message:    string;
}

interface ClassifiedError {
  status:    number;
  message:   string;
  logEvent:  LogEvent;
  logLevel:  'error' | 'warn';
  trace?:    string;
}

/**
 * Net de seguridad global — captura todas las excepciones no manejadas.
 *
 * Prioridad de clasificación:
 *  1. AppError (dominio / infraestructura) → usa su propio statusCode y logEvent
 *  2. HttpException de Nest               → comportamiento estándar de Nest
 *  3. QueryFailedError de TypeORM         → mapea códigos PG a HTTP
 *  4. Cualquier otro Error               → 500 con LogEvent.SYSTEM
 */
@Injectable()
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: AppLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx      = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request  = ctx.getRequest<Request>();

    const { status, message, logEvent, logLevel, trace } =
      this.classify(exception);

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp:  new Date().toISOString(),
      path:       request.url,
      method:     request.method,
      message,
    };

    const logLine = `${request.method} ${request.url} → ${status}`;

    if (logLevel === 'error') {
      this.logger.error(logLine, logEvent, AllExceptionsFilter.name, trace);
    } else {
      this.logger.warn(logLine, logEvent, AllExceptionsFilter.name);
    }

    response.status(status).json(errorResponse);
  }

  // ─── Clasificación ────────────────────────────────────────────────────────

  private classify(exception: unknown): ClassifiedError {
    // 1. AppError — nuestras excepciones tipadas (dominio e infraestructura)
    if (exception instanceof AppError) {
      return {
        status:   exception.statusCode,
        message:  exception.message,
        logEvent: exception.logEvent,
        logLevel: exception.logLevel,
        trace:    exception.logLevel === 'error' ? exception.stack : undefined,
      };
    }

    // 2. HttpException de Nest (NotFoundException, ConflictException, etc.)
    if (exception instanceof HttpException) {
      return this.classifyHttpException(exception);
    }

    // 3. QueryFailedError de TypeORM — BD falló antes de llegar al servicio
    if (exception instanceof QueryFailedError) {
      return this.classifyQueryFailedError(exception);
    }

    // 4. Fallback — error completamente desconocido
    return {
      status:   HttpStatus.INTERNAL_SERVER_ERROR,
      message:  'Internal server error',
      logEvent: LogEvent.SYSTEM,
      logLevel: 'error',
      trace:    exception instanceof Error
        ? exception.stack
        : String(exception),
    };
  }

  private classifyHttpException(exception: HttpException): ClassifiedError {
    const status  = exception.getStatus();
    const res     = exception.getResponse();

    let message: string;
    if (typeof res === 'string') {
      message = res;
    } else {
      const body = res as Record<string, unknown>;
      const raw  = body['message'];
      message    = Array.isArray(raw) ? raw.join(', ') : String(raw ?? 'Error');
    }

    const isAuthError = status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN;

    return {
      status,
      message,
      logEvent: isAuthError ? LogEvent.SECURITY : LogEvent.HTTP,
      logLevel: status >= 500 ? 'error' : 'warn',
      trace:    status >= 500 ? exception.stack : undefined,
    };
  }

  private classifyQueryFailedError(exception: QueryFailedError): ClassifiedError {
    const { status, message } = this.mapPgCode(exception);

    return {
      status,
      message,
      logEvent: LogEvent.DATABASE,
      logLevel: status >= 500 ? 'error' : 'warn',
      trace:    status >= 500 ? exception.stack : undefined,
    };
  }

  // ─── Mapeo de códigos PostgreSQL ──────────────────────────────────────────

  private mapPgCode(err: QueryFailedError): { status: number; message: string } {
    const code = (err as unknown as { code?: string }).code;

    switch (code) {
      // unique_violation
      case '23505':
        return { status: HttpStatus.CONFLICT,
                 message: 'Ya existe un registro con esos datos' };
      // foreign_key_violation
      case '23503':
        return { status: HttpStatus.CONFLICT,
                 message: 'Referencia a entidad inválida o inexistente' };
      // not_null_violation
      case '23502':
        return { status: HttpStatus.BAD_REQUEST,
                 message: 'Campo requerido faltante' };
      // check_violation
      case '23514':
        return { status: HttpStatus.BAD_REQUEST,
                 message: 'Valor fuera del rango permitido' };
      // connection / timeout
      case '08000':
      case '08006':
      case '57014':
        return { status: HttpStatus.SERVICE_UNAVAILABLE,
                 message: 'Base de datos no disponible' };
      default:
        return { status: HttpStatus.INTERNAL_SERVER_ERROR,
                 message: 'Error de base de datos' };
    }
  }
}
