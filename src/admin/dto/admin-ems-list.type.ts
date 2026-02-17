import { Field, Int, ObjectType } from '@nestjs/graphql';
import { Company } from 'src/company/entities/company.entity';

@ObjectType()
export class AdminEMSListResponse {
  @Field(() => [Company])
  companies: Company[];

  @Field(() => Int)
  total: number;
}
