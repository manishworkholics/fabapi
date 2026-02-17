import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Quote } from 'src/quote/entities/quote.entity';
import { AdminRFQ } from './admin-rfq.type';

@ObjectType()
export class AdminRFQListResponse {
  @Field(() => [AdminRFQ])
  rfqs: AdminRFQ[];

  @Field(() => Int)
  total: number;
}

