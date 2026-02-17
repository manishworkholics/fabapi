import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class AdminToggleUserInput {
  @Field(() => Int)
  userId: number;

  @Field()
  isDisabled: boolean;
}
