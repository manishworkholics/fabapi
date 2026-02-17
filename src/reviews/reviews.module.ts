import { Module } from '@nestjs/common';
import { ReviewsResolver } from './reviews.resolver';
import { ReviewsService } from './reviews.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  providers: [ReviewsResolver, ReviewsService, PrismaService],
})
export class ReviewsModule {}
