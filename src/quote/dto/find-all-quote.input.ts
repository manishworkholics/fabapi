import { Field, InputType, Int, registerEnumType } from '@nestjs/graphql';
import { QuoteFilterInput } from './filter-quote.input';
import { IsOptional } from 'class-validator';

@InputType()
export class FindAllQuotesInput {
  @Field({ nullable: true })
  search?: string;

  @Field(() => SortBy, { nullable: true })
  sortBy?: SortBy;

  @Field(() => SortOrder, { nullable: true })
  sortOrder?: SortOrder;

  @Field(() => Int, { nullable: true })
  page?: number;

  @Field(() => Int, { nullable: true })
  limit?: number;

  @Field(() => QuoteFilterInput, { nullable: true })
  @IsOptional()
  filters?: QuoteFilterInput;
}

export enum SortOrder {
  asc = 'asc',
  desc = 'desc',
}

registerEnumType(SortOrder, {
  name: 'SortOrder',
  description: 'Sort order',
});

export enum SortBy {
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
}

registerEnumType(SortBy, {
  name: 'SortBy',
  description: 'Sort by',
});
