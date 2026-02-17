import { Field, Int, ObjectType, GraphQLISODateTime } from '@nestjs/graphql';

@ObjectType()
export class AdminProject {
    @Field(() => Int)
    id: number;

    @Field()
    quoteId: string;


    @Field(() => Int)
    pmId: number;

    @Field(() => Int, { nullable: true })
    emsId?: number | null;

    @Field()
    status: string;

    @Field(() => GraphQLISODateTime)
    createdAt: Date;
}
