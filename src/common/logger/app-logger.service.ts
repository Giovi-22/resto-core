import { Injectable, LoggerService, Scope } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LogEvent } from './log-event.enum.js';
import { LoggerConfig, DEFAULT_LOGGER_CONFIG } from './logger.config.js';

type LogLevel = 'log' | 'warn' | 'error' | 'debug' | 'verbose';

@Injectable({ scope: Scope.DEFAULT })
export class AppLoggerService implements LoggerService {
  private config: LoggerConfig;

  constructor(private readonly configService: ConfigService) {
    const isDev = this.configService.get<string>('NODE_ENV') === 'development';

    // En producción solo errores y warnings por defecto
    const enabledEvents = isDev
      ? []  // vacío = todos
      : [LogEvent.SECURITY, LogEvent.SYSTEM, LogEvent.AUTH];

    this.config = {
      ...DEFAULT_LOGGER_CONFIG,
      enabledEvents,
    };
  }

  // ─── Control en caliente ───────────────────────────────────────────────────

  enable(): void  { this.config.enabled = true; }
  disable(): void { this.config.enabled = false; }

  enableEvent(event: LogEvent): void {
    if (!this.config.enabledEvents.includes(event)) {
      this.config.enabledEvents.push(event);
    }
  }

  disableEvent(event: LogEvent): void {
    this.config.enabledEvents = this.config.enabledEvents.filter(e => e !== event);
  }

  enableAll(): void  { this.config.enabledEvents = []; }
  disableAll(): void { this.config.enabledEvents = Object.values(LogEvent); }

  getConfig(): Readonly<LoggerConfig> { return { ...this.config }; }

  // ─── Métodos de log con categoría ─────────────────────────────────────────

  log(message: string, event: LogEvent = LogEvent.SYSTEM, context?: string): void {
    this.write('log', event, message, context);
  }

  warn(message: string, event: LogEvent = LogEvent.SYSTEM, context?: string): void {
    this.write('warn', event, message, context);
  }

  error(message: string, event: LogEvent = LogEvent.SYSTEM, context?: string, trace?: string): void {
    this.write('error', event, message, context, trace);
  }

  debug(message: string, event: LogEvent = LogEvent.SYSTEM, context?: string): void {
    this.write('debug', event, message, context);
  }

  verbose(message: string, event: LogEvent = LogEvent.SYSTEM, context?: string): void {
    this.write('verbose', event, message, context);
  }

  // ─── Implementación LoggerService (compatibilidad con Nest) ───────────────
  // Nest llama estos métodos desde su propio sistema interno.

  /** @internal usado por NestJS internamente */
  fatal(message: unknown, ...optionalParams: unknown[]): void {
    this.writeRaw('error', String(message), optionalParams);
  }

  // ─── Internos ─────────────────────────────────────────────────────────────

  private isAllowed(event: LogEvent): boolean {
    if (!this.config.enabled) return false;
    // enabledEvents vacío = todos permitidos
    if (this.config.enabledEvents.length === 0) return true;
    return this.config.enabledEvents.includes(event);
  }

  private write(
    level: LogLevel,
    event: LogEvent,
    message: string,
    context?: string,
    trace?: string,
  ): void {
    if (!this.isAllowed(event)) return;

    const ts   = this.config.timestamps ? `[${new Date().toISOString()}] ` : '';
    const ctx  = context ? ` [${context}]` : '';
    const tag  = `[${event.toUpperCase()}]`;
    const line = `${ts}${tag}${ctx} ${message}`;

    switch (level) {
      case 'log':     console.log(   this.colorize('log',  line)); break;
      case 'warn':    console.warn(  this.colorize('warn', line)); break;
      case 'error':
        console.error(this.colorize('error', line));
        if (trace) console.error(trace);
        break;
      case 'debug':   console.debug( this.colorize('debug',  line)); break;
      case 'verbose': console.log(   this.colorize('verbose',line)); break;
    }
  }

  /** Para mensajes internos de Nest sin categoría */
  private writeRaw(level: LogLevel, message: string, params: unknown[]): void {
    const context = typeof params.at(-1) === 'string' ? (params.at(-1) as string) : undefined;
    this.write(level, LogEvent.SYSTEM, message, context);
  }

  private colorize(level: LogLevel, text: string): string {
    // ANSI colors — solo en TTY
    if (!process.stdout.isTTY) return text;
    const colors: Record<LogLevel, string> = {
      log:     '\x1b[32m',  // verde
      warn:    '\x1b[33m',  // amarillo
      error:   '\x1b[31m',  // rojo
      debug:   '\x1b[36m',  // cyan
      verbose: '\x1b[90m',  // gris
    };
    return `${colors[level]}${text}\x1b[0m`;
  }
}

