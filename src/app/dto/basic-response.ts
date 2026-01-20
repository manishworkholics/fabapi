import { Field, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class BasicResponse {
  @Field(() => String, { nullable: true })
  status: string;

  @Field(() => String, { nullable: true })
  message: string;
}
