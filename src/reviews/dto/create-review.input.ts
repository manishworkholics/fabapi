import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class CreateReviewInput {
  @Field(() => Int)
  emsId: number;

  @Field(() => Int)
  rating: number;

  @Field()
  comment: string;
}
