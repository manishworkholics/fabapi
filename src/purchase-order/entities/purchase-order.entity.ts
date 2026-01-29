import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class PurchaseOrder {
  @Field() id: string;
  @Field() projectId: string;
  @Field() quoteId: string;
  @Field() bidId: string;
  @Field() vendorName: string;
  @Field() subtotal: number;
  @Field() total: number;
  @Field() createdAt: Date;
}
