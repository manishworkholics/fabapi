import { Field, Int, ObjectType, GraphQLISODateTime } from '@nestjs/graphql';

@ObjectType()
export class AdminRFQ {
  @Field(() => Int)
  id: number;

  @Field()
  quoteName: string;

  @Field(() => GraphQLISODateTime)
  createdAt: Date;

  @Field(() => Int)
  userId: number;
}
