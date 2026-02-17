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

  @Field(() => String, { nullable: true })
  username?: string | null;


  @Field(() => [Otp], { nullable: true })
  otps?: Otp[];

  @Field()
  email: string;

  @Field(() => String, { nullable: true })
  firstName?: string | null;

  @Field(() => String, { nullable: true })
  lastName?: string | null;

  @Field(() => String, { nullable: true })
  phone?: string | null;


  @Field(() => UserRole, { nullable: true })
  role?: UserRole;

  @Field(() => Profile, { nullable: true })
  profile?: Profile;

  @Field(() => Company, { nullable: true })
  company?: Company;

  @Field(() => GraphQLISODateTime)
  createdAt: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  verifiedAt?: Date | null;

  @Field(() => GraphQLISODateTime)
  updatedAt: Date;

}



registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'user roles',
});
