import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const frontendOrigin = process.env.FRONTEND_URL || 'http://localhost:3000';
  app.enableCors({
    origin: frontendOrigin,
    credentials: true,
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
  console.log(`LogiAgent API running on http://localhost:${port}`);
}

bootstrap();
