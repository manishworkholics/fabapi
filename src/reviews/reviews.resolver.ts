import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { ReviewsService } from './reviews.service';
import { ReviewType } from './dto/review.type';
import { CreateReviewInput } from './dto/create-review.input';
import { ReviewStatsType } from './dto/review-stats.type';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Resolver()
export class ReviewsResolver {
    constructor(private reviewsService: ReviewsService) { }

    // ✅ create review
    @Mutation(() => ReviewType)
    createReview(
        @Args('pmId', { type: () => Int }) pmId: number,
        @Args('input') input: CreateReviewInput,
    ) {
        return this.reviewsService.create(pmId, input);
    }

    // ✅ list reviews
    @Query(() => [ReviewType])
    emsReviews(
        @Args('emsId', { type: () => Int }) emsId: number,
    ) {
        return this.reviewsService.getEMSReviews(emsId);
    }

    // ✅ stats
    @Query(() => ReviewStatsType)
    emsReviewStats(
        @Args('emsId', { type: () => Int }) emsId: number,
    ) {
        return this.reviewsService.getStats(emsId);
    }
}
