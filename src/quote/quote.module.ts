import { Module } from '@nestjs/common';
import { QuoteService } from './quote.service';
import { QuoteResolver } from './quote.resolver';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [QuoteResolver, QuoteService, PrismaService],
  exports: [QuoteService], // Export QuoteService so it can be used in other modules
})
export class QuoteModule {}
