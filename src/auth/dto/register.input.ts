import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { IsAlpha, IsEmail, IsNotEmpty } from 'class-validator';

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
}
