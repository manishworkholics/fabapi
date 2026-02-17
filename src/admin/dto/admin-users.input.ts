import { Field, InputType, Int } from '@nestjs/graphql';
import { UserRole } from 'src/common/enums/user-role.enum';

@InputType()
export class AdminUsersInput {
  @Field(() => Int, { defaultValue: 1 })
  page: number;

  @Field(() => Int, { defaultValue: 10 })
  limit: number;

  @Field(() => UserRole, { nullable: true })
  role?: UserRole;
}
