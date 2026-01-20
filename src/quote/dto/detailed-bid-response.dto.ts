import { ObjectType, Field, Int } from '@nestjs/graphql';
import { User } from 'src/user/user.entity';
import { Quote } from '../entities/quote.entity';
import { PricingLineItem } from './pricing-line-item.dto';

@ObjectType()
export class ProjectApproach {
  @Field(() => String, { nullable: true })
  relevantExperience?: string;

  @Field(() => String, { nullable: true })
  technicalApproach?: string;

  @Field(() => String, { nullable: true })
  estimatedTimeline?: string;
}

@ObjectType()
export class DetailedBidResponse {
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

  @Field(() => Number)
  amount: number;

  @Field(() => String, { nullable: true })
  message?: string;

  @Field(() => Date)
  createdAt: Date;

  @Field(() => ProjectApproach, { nullable: true })
  projectApproach?: ProjectApproach;

  @Field(() => [PricingLineItem], { nullable: true })
  pricingBreakdown?: PricingLineItem[];

  @Field(() => Number, { nullable: true })
  totalEstimatedCost?: number;

  @Field(() => String, { nullable: true })
  additionalNotes?: string;
}
