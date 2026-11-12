import { LogEvent } from './log-event.enum.js';

export interface LoggerConfig {
  /** Habilita/deshabilita el logger globalmente */
  enabled: boolean;
  /** Categorías activas. Si está vacío y enabled=true, loguea todo. */
  enabledEvents: LogEvent[];
  /** Muestra timestamps en cada línea */
  timestamps: boolean;
}

export const DEFAULT_LOGGER_CONFIG: LoggerConfig = {
  enabled: true,
  enabledEvents: [],   // vacío = todas las categorías activas
  timestamps: true,
};

