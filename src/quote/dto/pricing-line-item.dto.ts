import { InputType, Field, ObjectType } from '@nestjs/graphql';
import { IsString, IsNumber, Min } from 'class-validator';

@InputType()
export class PricingLineItemInput {
  @Field(() => String)
  @IsString()
  description: string;

  @Field()
  @IsNumber()
  @Min(0)
  unitPrice: number;

  @Field()
  @IsNumber()
  @Min(1)
  quantity: number;

  @Field()
  @IsNumber()
  @Min(0)
  totalPrice: number;
}

@ObjectType()
export class PricingLineItem {
  @Field(() => String)
  description: string;

  @Field()
  unitPrice: number;

  @Field()
  quantity: number;

  @Field()
  totalPrice: number;
}
