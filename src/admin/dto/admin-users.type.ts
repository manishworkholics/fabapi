import { Field, Int, ObjectType } from '@nestjs/graphql';
import { User } from '../../user/user.entity';

@ObjectType()
export class AdminUsersResponse {
  @Field(() => [User])
  users: User[];

  @Field(() => Int)
  total: number;
}
