import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { PricingLineItemInput } from './pricing-line-item.dto';

@InputType()
export class DetailedBidInput {
  // Project Approach
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  relevantExperience?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  technicalApproach?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  estimatedTimeline?: string;

  // Pricing Breakdown
  @Field(() => [PricingLineItemInput])
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PricingLineItemInput)
  pricingBreakdown: PricingLineItemInput[];

  // Additional Notes
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  additionalNotes?: string;
}
