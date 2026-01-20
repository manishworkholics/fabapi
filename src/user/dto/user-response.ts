import { Field, ObjectType } from '@nestjs/graphql';
import { User } from '../../user/user.entity';

@ObjectType()
export class UserResponse {
  @Field(() => String, { nullable: true })
  status: string;

  @Field(() => String, { nullable: true })
  message: string;

  @Field(() => User)
  user: User;
}
