import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class Project {
  @Field(() => Int)
  id: number;

  @Field()
  status: string;

  @Field()
  createdAt: Date;
}
