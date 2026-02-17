// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  /* ───────────── global config ───────────── */
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  });

  /* ───────────── Swagger setup ───────────── */
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Fabspace API')
    .setDescription('REST endpoints exposed by the NestJS gateway')
    .setVersion('1.0.0')
    .addBearerAuth() // → adds “Authorize” button
    .build();

  const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('swagger', app, swaggerDoc, {
    jsonDocumentUrl: 'swagger.json', // makes the raw spec available
    swaggerOptions: { persistAuthorization: true },
  });

  /* ───────────── start server ───────────── */
  await app.listen(process.env.PORT ?? 9001);
}

bootstrap();
