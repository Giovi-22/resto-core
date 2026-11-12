export { AppError }             from './app-error.js';

// Errores de dominio / negocio
export { ResourceNotFoundError } from './domain-errors.js';
export { ConflictDomainError }   from './domain-errors.js';
export { ForbiddenDomainError }  from './domain-errors.js';
export { UnprocessableError }    from './domain-errors.js';

// Errores de infraestructura
export { DatabaseError }         from './infra-errors.js';
export { ExternalServiceError }  from './infra-errors.js';

