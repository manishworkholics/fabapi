import { InputType, Field, ObjectType } from '@nestjs/graphql';
import { IsString, IsNumber, Min } from 'class-validator';

@InputType()
export class PricingLineItemInput {
  @Field(() => String)
  @IsString()
  description: string;

  @Field(() => Number)
  @IsNumber()
  @Min(0)
  price: number;
}

@ObjectType()
export class PricingLineItem {
  @Field(() => String)
  description: string;

  @Field(() => Number)
  price: number;
}
