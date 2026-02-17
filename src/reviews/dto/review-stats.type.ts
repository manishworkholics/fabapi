import { Field, Float, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ReviewStatsType {
  @Field(() => Float)
  averageRating: number;

  @Field(() => Int)
  reviewCount: number;
}
