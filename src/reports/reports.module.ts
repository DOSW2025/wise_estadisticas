import { Module } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [ReportsService],
})
export class ReportsModule {}
