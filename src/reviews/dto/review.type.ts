import { Field, Int, ObjectType } from '@nestjs/graphql';

@ObjectType()
export class ReviewType {
    @Field(() => Int)
    id: number;

    @Field(() => Int)
    rating: number;

    @Field()
    comment: string;

    @Field(() => Int)
    pmId: number;

    @Field(() => Int)
    emsId: number;

    @Field()
    createdAt: Date;

    // optional display name
    @Field({ nullable: true })
    reviewerName?: string;
}
