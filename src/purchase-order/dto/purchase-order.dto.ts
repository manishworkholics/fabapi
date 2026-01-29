import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

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

    @Field(() => [String])
    items: string[]; // stored as JSON in DB

    @Field(() => Float)
    subtotal: number;

    @Field(() => Float)
    tax: number;

    @Field(() => Float)
    total: number;
}
