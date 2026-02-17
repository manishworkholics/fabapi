import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class AdminToggleCompanyInput {
  @Field(() => Int)
  companyId: number;

  @Field()
  isDisabled: boolean;
}
