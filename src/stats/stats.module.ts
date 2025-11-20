import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { StatsService } from './stats.service.js';
import { StatsController } from './stats.controller.js';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
