import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Quote } from './quote.entity';

@ObjectType()
export class Quotes {
  @Field(() => [Quote])
  quotes: Quote[];

  @Field(() => Int)
  totalCount: number;
}
