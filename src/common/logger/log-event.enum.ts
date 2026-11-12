/**
 * Categorías de eventos de log.
 * Permite filtrar por dominio sin tocar el nivel (error/warn/log).
 */
export enum LogEvent {
  // ─── Infraestructura ───────────────────────────────────────────
  BOOTSTRAP   = 'bootstrap',    // Arranque de la app
  DATABASE    = 'database',     // Conexión / queries lentas
  HTTP        = 'http',         // Requests / responses

  // ─── Negocio ───────────────────────────────────────────────────
  AUTH        = 'auth',         // Login, registro, tokens
  RESTAURANT  = 'restaurant',   // CRUD de restaurantes
  USER        = 'user',         // CRUD de usuarios
  ORDER       = 'order',        // Pedidos (futuro)

  // ─── Transversales ─────────────────────────────────────────────
  SECURITY    = 'security',     // Intentos de acceso no autorizado
  VALIDATION  = 'validation',   // Errores de validación de DTOs
  SYSTEM      = 'system',       // Eventos genéricos del sistema
}

