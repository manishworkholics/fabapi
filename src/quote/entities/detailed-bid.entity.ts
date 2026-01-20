import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Quote } from './quote.entity';
import { User } from 'src/user/user.entity';
import { PricingLineItem } from '../dto/pricing-line-item.dto';

@ObjectType()
export class DetailedBid {
  @Field(() => String)
  id: string;

  @Field(() => String)
  quoteId: string;

  @Field(() => Quote)
  quote: Quote;

  @Field(() => Int)
  bidderId: number;

  @Field(() => User)
  bidder: User;

  // Project Approach
  @Field(() => String, { nullable: true })
  relevantExperience?: string;

  @Field(() => String, { nullable: true })
  technicalApproach?: string;

  @Field(() => String, { nullable: true })
  estimatedTimeline?: string;

  // Pricing Breakdown
  @Field(() => [PricingLineItem])
  pricingBreakdown: PricingLineItem[];

  @Field(() => Number)
  totalEstimatedCost: number;

  // Additional Notes
  @Field(() => String, { nullable: true })
  additionalNotes?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}
