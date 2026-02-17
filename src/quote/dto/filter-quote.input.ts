import { Field, InputType, Int } from '@nestjs/graphql';
import { Prisma } from '@prisma/client';
import { QuoteStatus, QuoteType } from '../entities/quote.entity';
import { IsOptional } from 'class-validator';

@InputType()
export class QuoteFilterInput implements Prisma.QuoteWhereInput {
  @Field(() => Number, { nullable: true })
  id?: number;

  @Field({ nullable: true })
  title?: string;

  @Field({ nullable: true })
  description?: string;

  @Field({ nullable: true })
  pcbBoards?: number;

  @Field(() => Number, { nullable: true })
  stencils?: number;

  @Field(() => Number, { nullable: true })
  components?: number;

  @Field(() => QuoteType, { nullable: true })
  @IsOptional()
  quoteType?: QuoteType;

  @Field(() => QuoteStatus, { nullable: true })
  @IsOptional()
  status?: any;
}
