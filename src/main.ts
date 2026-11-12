import 'reflect-metadata';
import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, ClassSerializerInterceptor } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { ResponseInterceptor } from './common/interceptors/response.interceptor.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);
  const reflector = app.get(Reflector);

  // ─── Prefijo global ───────────────────────────────────────────
  const apiPrefix = config.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // ─── CORS ─────────────────────────────────────────────────────
  app.enableCors({
    origin: config.get<string>('CORS_ORIGIN', 'http://localhost:5173'),
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // ─── Validación global de DTOs ────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,         // Strip propiedades no decoradas
      forbidNonWhitelisted: true,
      transform: true,         // Auto-transform payloads a instancias TS
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ─── Interceptors y Filters globales ─────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(
    new ClassSerializerInterceptor(reflector),
    new ResponseInterceptor(),
  );

  // ─── Swagger ──────────────────────────────────────────────────
  if (config.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('GastroManager API')
      .setDescription('Sistema de gestión gastronómica — API REST')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth', 'Autenticación y autorización')
      .addTag('Restaurants', 'Gestión de restaurantes')
      .addTag('Users', 'Gestión de usuarios')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const port = config.get<number>('PORT', 3000);
  await app.listen(port);

  console.log(`\n🍽️  GastroManager API corriendo en: http://localhost:${port}/${apiPrefix}`);
  console.log(`📚  Swagger UI: http://localhost:${port}/docs\n`);
}

await bootstrap();
