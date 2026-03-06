import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // ── Prefix & Versioning ────────────────────────────────────────
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // ── CORS ───────────────────────────────────────────────────────
  const origins = configService.get<string>('CORS_ORIGINS', '').split(',');
  app.enableCors({
    origin: origins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });

  // ── Global Pipes ───────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // strip unknown fields
      forbidNonWhitelisted: true,
      transform: true,          // auto-transform payloads to DTO instances
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // ── Global Filters & Interceptors ─────────────────────────────
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // ── Swagger ────────────────────────────────────────────────────
  if (configService.get<string>('NODE_ENV') !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Accident Assessment API')
      .setDescription('AI-powered vehicle accident assessment backend')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  // ── Start ──────────────────────────────────────────────────────
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`\n🚀 Server running on: http://localhost:${port}/${apiPrefix}`);
  console.log(`📄 Swagger docs:      http://localhost:${port}/${apiPrefix}/docs\n`);
}

bootstrap();