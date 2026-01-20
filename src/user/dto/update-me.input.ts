import { InputType, Field } from '@nestjs/graphql';
import { UserRole } from '../user.entity';
import { UpdateProfileInput } from './update-profile.input';

@InputType()
export class UpdateMeInput {
  @Field(() => String, { nullable: true })
  firstName?: string;

  @Field(() => String, { nullable: true })
  lastName?: string;

  @Field(() => String, { nullable: true })
  username?: string;

  @Field(() => String, { nullable: true })
  phone?: string;

  @Field((type) => UserRole, { nullable: true })
  userRole?: UserRole;

  @Field((type) => UpdateProfileInput, { nullable: true })
  profile?: UpdateProfileInput;
}
