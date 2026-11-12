import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { validationSchema } from './config/env.validation.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { RestaurantsModule } from './modules/restaurants/restaurants.module.js';
import { User } from './modules/users/entities/user.entity.js';
import { Restaurant } from './modules/restaurants/entities/restaurant.entity.js';
import { LoggerModule } from './common/logger/index.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';

@Module({
  imports: [
    // ─── Logger global ────────────────────────────────────────────
    LoggerModule,

    // ─── Config global ────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      envFilePath: '.env',
    }),

    // ─── Base de datos ────────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USERNAME'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_DATABASE'),
        entities: [User, Restaurant],
        synchronize: config.get<string>('NODE_ENV') === 'development',
        logging: config.get<string>('NODE_ENV') === 'development',
      }),
    }),

    // ─── Módulos de negocio ───────────────────────────────────────
    AuthModule,
    RestaurantsModule,
  ],
  providers: [AllExceptionsFilter],
})
export class AppModule {}
