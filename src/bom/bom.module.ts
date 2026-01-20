// src/bom/bom.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { BomController } from './bom.controller';
import { BomService } from './bom.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // .env support
    HttpModule, // outbound HTTP
  ],
  controllers: [BomController],
  providers: [BomService, PrismaService],
})
export class BomModule {}
