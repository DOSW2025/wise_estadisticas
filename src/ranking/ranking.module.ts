import { Module } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  providers: [RankingService],
})
export class RankingModule {}
