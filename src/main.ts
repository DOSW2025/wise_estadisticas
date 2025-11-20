import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { swaggerConfig } from './swagger'; // ← ya no dará error

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();

  swaggerConfig(app); // ← activa Swagger

  await app.listen(3000);
  console.log('[INFO] Server is running on http://localhost:3000');
}
bootstrap();
