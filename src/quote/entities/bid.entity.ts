import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Quote } from './quote.entity';
import { User } from 'src/user/user.entity';

@ObjectType()
export class Bid {
  @Field(() => String)
  id: string;

  @Field()
  amount: number;

  @Field(() => Int)
  userId: number;

  @Field(() => User)
  user: User;

  @Field(() => String)
  quoteId: string;

  @Field(() => Quote)
  quote: Quote;

  @Field(() => Int)
  bidderId: number;

  @Field(() => User)
  bidder: User;

  @Field(() => Date)
  createdAt: Date;
}
