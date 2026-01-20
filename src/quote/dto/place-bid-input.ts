import { InputType, Field } from '@nestjs/graphql';
import { IsString } from 'class-validator';

@InputType()
export class PlaceBidInput {
  @Field(() => Number)
  amount: number;

  @Field(() => String, { nullable: true })
  @IsString()
  message?: string;
}
