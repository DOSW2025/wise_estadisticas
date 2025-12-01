import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { swaggerConfig } from './swagger'; // ← ya no dará error

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();

  swaggerConfig(app); // ← activa Swagger

  // Development helper: inject a fake admin user into `req.user` so
  // endpoints that check `req.user.role` work without a full auth setup.
  // NOTE: remove this middleware in production.
  app.use((req: any, _res: any, next: any) => {
    if (!req.user) {
      req.user = { id: process.env.DEV_ADMIN_ID || 'dev-admin', role: 'ADMIN' };
    }
    next();
  });

  await app.listen(3000);
  console.log('[INFO] Server is running on http://localhost:3000');
}
bootstrap();
