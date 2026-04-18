
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';  // ← ШИНЭ
import { join } from 'path';                                         // ← ШИНЭ
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
 
async function bootstrap() {
  // ── NestExpressApplication type ашиглана ─────────────────────
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const configService = app.get(ConfigService);
 
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);
 
  const origins = configService.get<string>('CORS_ORIGINS', '').split(',');
  app.enableCors({
    origin: origins,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
  });
 
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
 
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());
 
  // ── 🆕 Static files serve ─────────────────────────────────────
  // /uploads/ route руу хандахад ./uploads фолдерын файлуудыг буцаана
  // Жишэ: GET http://localhost:3000/uploads/uuid.jpg
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
 
  // ── 🆕 Multer payload limit (5MB + overhead) ──────────────────
  // Express-ийн default limit 100kb тул 10MB болгоно
  app.use(require('express').json({ limit: '10mb' }));
  app.use(require('express').urlencoded({ limit: '10mb', extended: true }));
 
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
 
  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
  console.log(`\n🚀 Server running on: http://localhost:${port}/${apiPrefix}`);
  console.log(`📄 Swagger docs:      http://localhost:${port}/${apiPrefix}/docs`);
  console.log(`🖼️  Static uploads:   http://localhost:${port}/uploads/\n`);
}
 
bootstrap();
 