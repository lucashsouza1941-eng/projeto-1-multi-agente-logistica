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

function validateSecrets(): void {
  const j = process.env.JWT_SECRET?.trim() ?? '';
  const r = process.env.REFRESH_TOKEN_SECRET?.trim() ?? '';
  if (j.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters.');
  }
  if (r.length < 32) {
    throw new Error(
      'REFRESH_TOKEN_SECRET must be set and at least 32 characters.',
    );
  }
}

async function bootstrap() {
  validateSecrets();
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  app.useGlobalInterceptors(new CorrelationIdInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Security headers with explicit CSP suitable for JSON API + Swagger UI.
  app.use(
    helmet({
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          connectSrc: ["'self'"],
        },
      },
      frameguard: { action: 'deny' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      xContentTypeOptions: true,
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const isProd = process.env.NODE_ENV === 'production';

  const prodAllowlist = new Set(
    (process.env.FRONTEND_URL || 'http://localhost:3000')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
  );

  app.enableCors({
    origin: (origin, callback) => {
      if (!isProd) {
        callback(null, true);
        return;
      }
      if (!origin || prodAllowlist.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`Not allowed by CORS: ${origin}`));
    },
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
