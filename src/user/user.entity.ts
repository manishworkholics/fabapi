import {
  registerEnumType,
  Field,
  ObjectType,
  ID,
  GraphQLISODateTime,
} from '@nestjs/graphql';
import { Profile } from '../profile/profile.entity';
import { Otp } from '../otp/otp.entity';
import { Company } from 'src/company/entities/company.entity';
import { UserRole } from '../common/enums/user-role.enum';


@ObjectType()
export class User {
  @Field(() => ID)
  id: number;

  @Field({ nullable: true })
  username: string;

  @Field(() => [Otp], { nullable: true })
  otps?: Otp[];

  @Field()
  email: string;

  @Field(() => String, { nullable: true })
  firstName: string;

  @Field(() => String, { nullable: true })
  lastName: string;

  @Field({ nullable: true })
  phone?: string;

  @Field(() => UserRole, { nullable: true })
  role?: UserRole;

  @Field(() => Profile, { nullable: true })
  profile?: Profile;

  @Field(() => Company, { nullable: true })
  company?: Company;

  @Field(() => GraphQLISODateTime)
  createdAt: string;

  @Field(() => GraphQLISODateTime, { nullable: true })
  verifiedAt?: string;

  @Field(() => GraphQLISODateTime)
  updatedAt: string;
}



registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'user roles',
});
