import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class UpdateCompanyInput {
  @Field({ nullable: true })
  name?: string;

  @Field({ nullable: true })
  address?: string;

  @Field({ nullable: true })
  state?: string;

  @Field({ nullable: true })
  country?: string;
}
