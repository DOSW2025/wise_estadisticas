import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [AdminService],
})
export class AdminModule {}
