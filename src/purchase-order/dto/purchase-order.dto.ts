import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { PurchaseOrderItemDTO } from './purchase-order-item-dto';

@ObjectType()
export class PurchaseOrderDTO {
    @Field(() => String)
    id: string;

    @Field(() => Int)
    projectId: number;

    @Field(() => String)
    quoteId: string;

    @Field(() => String)
    bidId: string;

    @Field(() => Int)
    pmId: number;

    @Field(() => Int)
    emsId: number;

    @Field(() => String)
    vendorName: string;

    @Field(() => [PurchaseOrderItemDTO])
    items: PurchaseOrderItemDTO[];

    @Field(() => Float)
    subtotal: number;

    @Field(() => Float)
    tax: number;

    @Field(() => Float)
    total: number;
}
