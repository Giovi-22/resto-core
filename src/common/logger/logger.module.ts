import { Global, Module } from '@nestjs/common';
import { AppLoggerService } from './app-logger.service.js';

/**
 * @Global → disponible en toda la app sin importarlo módulo a módulo.
 * Solo se importa una vez en AppModule.
 */
@Global()
@Module({
  providers: [AppLoggerService],
  exports:   [AppLoggerService],
})
export class LoggerModule {}

