import { InputType, Int, Field } from '@nestjs/graphql';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class LoginInput {
  @IsNotEmpty()
  @IsEmail()
  @Field(() => String, { description: 'User Email' })
  email: string;

  @IsNotEmpty()
  @IsString()
  @Field(() => String, { description: 'User Password' })
  password: string;
}
