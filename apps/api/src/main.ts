import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import { AppModule } from './app.module';
import {
  GlobalExceptionFilter,
  CorrelationIdInterceptor,
} from './common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.useGlobalInterceptors(new CorrelationIdInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const isProd = process.env.NODE_ENV === 'production';
  const corsOrigins = isProd
    ? [process.env.FRONTEND_URL || 'http://localhost:3000']
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:3001',
        'http://127.0.0.1:3001',
        ...(process.env.FRONTEND_URL
          ? process.env.FRONTEND_URL.split(',').map((o) => o.trim())
          : []),
      ];
  app.enableCors({
    origin: [...new Set(corsOrigins)],
    credentials: true,
    exposedHeaders: ['X-Correlation-ID'],
  });

  const config = new DocumentBuilder()
    .setTitle('LogiAgent API')
    .setDescription('API do sistema multi-agente de logística')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  app.get(Logger).log(`LogiAgent API running on http://localhost:${port}`);
}

bootstrap();
