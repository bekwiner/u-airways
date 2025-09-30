import { Module } from '@nestjs/common';
import { TaxisService } from './taxis.service';
import { TaxisController } from './taxis.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TaxisController],
  providers: [TaxisService],
  exports: [TaxisService],
})
export class TaxisModule {}
