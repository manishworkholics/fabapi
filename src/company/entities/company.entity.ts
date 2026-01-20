import { ObjectType, Field, GraphQLISODateTime, ID } from '@nestjs/graphql';

@ObjectType()
export class Company {
  @Field(() => ID)
  id: number;

  @Field({ nullable: true })
  name: string;

  @Field({ nullable: true })
  address: string;

  @Field({ nullable: true })
  state: string;

  @Field({ nullable: true })
  country: string;

  @Field(() => GraphQLISODateTime)
  createdAt: string;

  @Field(() => GraphQLISODateTime)
  updatedAt: string;
}
