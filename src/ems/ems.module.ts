import { Module } from '@nestjs/common';
import { EMSService } from './ems.service';
import { EMSResolver } from './ems.resolver';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [EMSResolver, EMSService, PrismaService],
})
export class EMSModule {}
