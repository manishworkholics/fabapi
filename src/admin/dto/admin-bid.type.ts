import { Field, Int, ObjectType, GraphQLISODateTime } from '@nestjs/graphql';

@ObjectType()
export class AdminBid {
    @Field()
    id: string;


    @Field(() => Int)
    bidderId: number;


    @Field()
    quoteId: string;

    @Field(() => GraphQLISODateTime)
    createdAt: Date;
}
