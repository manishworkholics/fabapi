import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { UserRole } from '../../common/enums/user-role.enum';


@InputType()
export class RegisterInput {
  @IsNotEmpty()
  @IsEmail()
  @Field(() => String)
  email: string;

  @Field(() => String, { nullable: true })
  firstName: string;

  @Field(() => String, { nullable: true })
  lastName: string;

  @Field(() => String, { nullable: true })
  companyName: string;

  @Field(() => String, { nullable: true })
  username: string;

  @IsNotEmpty()
  @Field(() => String)
  password: string;

  // ✅ ADD THIS
  @Field(() => UserRole)
  role: UserRole;

   @Field({ nullable: true })
  phone?: string;



  @Field()
  acceptTerms: boolean;
}
