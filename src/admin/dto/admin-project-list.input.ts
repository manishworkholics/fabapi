import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class AdminProjectListInput {
  @Field(() => Int, { defaultValue: 1 })
  page: number;

  @Field(() => Int, { defaultValue: 10 })
  limit: number;
}
