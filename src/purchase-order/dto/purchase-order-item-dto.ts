import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class PurchaseOrderItemDTO {
  @Field(() => String)
  description: string;

  @Field(() => Int)
  quantity: number;

  @Field(() => Float)
  unitPrice: number;

  @Field(() => Float)
  totalPrice: number;
}
