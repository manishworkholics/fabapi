import { InputType, Field, Int } from '@nestjs/graphql';
import { QuoteType } from '../entities/quote.entity';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsOptional,
  IsString,
} from 'class-validator';

@InputType()
export class CreateQuoteInput {
  @Field(() => String)
  @IsString()
  title: string;

  @Field(() => String)
  @IsString()
  description: string;

  @Field(() => [String])
  @IsArray()
  quoteMaterials: string[];

  @Field(() => String)
  @IsString()
  quoteName: string;

  @Field(() => Number, { nullable: true })
  pcbBoards?: number;

  @Field(() => Number, { nullable: true })
  stencils?: number;

  @Field(() => Number, { nullable: true })
  components?: number;

  @Field(() => Number)
  @IsIn([3, 5, 10])
  turnTime: number;

  @Field(() => [String])
  @IsArray()
  quoteFiles: string[];

  @Field(() => QuoteType)
  @IsEnum(QuoteType)
  quoteType: QuoteType;

  @Field(() => Number)
  budget: number;

  @Field(() => Int, { nullable: true })
  assignedEMSId?: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  hasNDA?: boolean;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isDraft?: boolean;

  @Field(() => [String], { nullable: true })
  @IsOptional()
  @IsArray()
  numberOfBoards?: string[];
}
