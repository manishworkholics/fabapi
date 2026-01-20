import {
  Field,
  ObjectType,
  Int,
  ID,
  GraphQLISODateTime,
} from '@nestjs/graphql';
import { User } from '../user/user.entity';

@ObjectType()
export class Otp {
  @Field(() => ID)
  id: number;

  @Field((type) => User)
  user: User;

  @Field(() => GraphQLISODateTime)
  createdAt: string;

  @Field(() => GraphQLISODateTime)
  updatedAt: string;
}
