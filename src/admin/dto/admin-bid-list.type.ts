import { Field, Int, ObjectType } from '@nestjs/graphql';
import { AdminBid } from './admin-bid.type';

@ObjectType()
export class AdminBidListResponse {
  @Field(() => [AdminBid])
  bids: AdminBid[];

  @Field(() => Int)
  total: number;
}
