import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { QuoteService } from './quote.service';
import { Quote } from './entities/quote.entity';
import { CreateQuoteInput } from './dto/create-quote.input';
import { UpdateQuoteInput } from './dto/update-quote.input';
import { AuthUser } from 'src/auth/decorators/auth-user.decorator';
import { BasicResponse } from 'src/app/dto/basic-response';
import { FindAllQuotesInput } from './dto/find-all-quote.input';
import { Quotes } from './entities/quotes.entity';
import { Bid } from './entities/bid.entity';
import { PlaceBidInput } from './dto/place-bid-input';
import { DetailedBidInput } from './dto/detailed-bid.input';
import { DetailedBidResponse } from './dto/detailed-bid-response.dto';
import { ProjectDTO } from '../projects/entities/project.entity';


@Resolver(() => Quote)
export class QuoteResolver {
  constructor(private readonly quoteService: QuoteService) { }

  @Query(() => Quotes, { name: 'quotes' })
  async quotes(
    @Args('params', { nullable: true }) params?: FindAllQuotesInput,
    @AuthUser() user?: { userId: number; role: string },
  ) {
    return await this.quoteService.findAllQuote(params, user);
  }

  @Query(() => Quotes, { name: 'myQuotes' })
  async myQuotes(
    @AuthUser() user: { userId: number; role: string },
    @Args('params', { nullable: true }) params?: FindAllQuotesInput,
  ) {
    return this.quoteService.findMyQuotes(params, {
      userId: user.userId,
      role: user.role,
    });
  }

  @Mutation(() => BasicResponse)
  async signNDA(
    @AuthUser() user: { userId: number; email: string },
    @Args('quoteId', { type: () => String }) quoteId: string,
  ) {
    let message = `Unable to sign NDA!`;

    const status = await this.quoteService.signNDA(quoteId, user.userId);

    if (status) {
      message = `NDA Signed Successfully.`;
    }

    return { status: status ? 'success' : 'failed', message };
  }

  @Query(() => Quote)
  async quote(
    @AuthUser() user: { userId: number; email: string },
    @Args('quoteId', { type: () => String }) quoteId: string,
  ) {
    return await this.quoteService.findOneQuote(quoteId, user.userId);
  }

  @Query(() => [Quote])
  async myDraftQuotes(@AuthUser() user: { userId: number; email: string }) {
    return this.quoteService.findMyDraftQuotes(user.userId);
  }

  @Query(() => Quote)
  async myDraftQuote(
    @AuthUser() user: { userId: number; email: string },
    @Args('quoteId', { type: () => String }) quoteId: string,
  ) {
    return await this.quoteService.findMyDraftQuoteById(user.userId, quoteId);
  }

  @Mutation(() => Quote)
  async createQuote(
    @AuthUser() user: { userId: number; email: string },
    @Args('createQuoteInput') createQuoteInput: CreateQuoteInput,
  ) {
    return await this.quoteService.createQuote(user.userId, createQuoteInput);
  }

  @Mutation(() => Quote)
  updateQuote(
    @Args('quoteId') quoteId: string,
    @Args('updateQuoteInput') updateQuoteInput: UpdateQuoteInput,
  ) {
    return this.quoteService.updateQuote(quoteId, updateQuoteInput);
  }

  @Mutation(() => BasicResponse)
  archiveQuote(@Args('quoteId', { type: () => String }) quoteId: string) {
    return this.quoteService.archiveQuote(quoteId);
  }

  @Mutation(() => BasicResponse)
  deleteQuote(@Args('quoteId', { type: () => String }) quoteId: string) {
    return this.quoteService.deleteQuote(quoteId);
  }

  @Mutation(() => Bid)
  async placeBid(
    @AuthUser() user: { userId: number; email: string },
    @Args('quoteId') quoteId: string,
    @Args('placeBidInput') placeBidInput: PlaceBidInput,
  ) {
    return this.quoteService.placeBid(quoteId, user.userId, placeBidInput);
  }

  @Mutation(() => Bid)
  async placeDetailedBid(
    @AuthUser() user: { userId: number; email: string },
    @Args('quoteId') quoteId: string,
    @Args('detailedBidInput') detailedBidInput: DetailedBidInput,
  ) {
    return this.quoteService.placeDetailedBid(
      quoteId,
      user.userId,
      detailedBidInput,
    );
  }

  @Query(() => DetailedBidResponse)
  async detailedBid(
    @AuthUser() user: { userId: number; email: string },
    @Args('bidId', { type: () => String }) bidId: string,
  ) {
    return this.quoteService.getDetailedBidById(bidId);
  }

  @Query(() => [DetailedBidResponse])
  async detailedBidsForQuote(
    @AuthUser() user: { userId: number; email: string },
    @Args('quoteId', { type: () => String }) quoteId: string,
  ) {
    return this.quoteService.getDetailedBidsForQuote(quoteId);
  }

  @Query(() => [Quote], { name: 'quickQuotations' })
  async quickQuotations(@AuthUser() user: { userId: number; email: string }) {
    return this.quoteService.findQuickQuotations(user.userId);
  }

  @Mutation(() => Boolean)
  async withdrawQuoteBid(
    @AuthUser() user: { userId: number; email: string },
    @Args('bidId') bidId: string,
  ) {
    return this.quoteService.withdrawQuoteBid(bidId, user.userId);
  }

  @Query(() => [Bid])
  async myBids(
    @AuthUser() user: { userId: number; email: string },
  ) {
    return this.quoteService.getMyBids(user.userId);
  }

  @Query(() => [Quote])
  async emsOpenQuotes(
    @AuthUser() user: { userId: number; email: string; role?: string },
  ) {
    // Optional role check
    // if (user.role !== 'EMS') throw new ForbiddenException('Only EMS can access');

    return this.quoteService.getOpenQuotesForEMS();
  }

  //............................... favorite...............................


  @Mutation(() => Boolean)
  addToFavorites(
    @AuthUser() user: { userId: number },
    @Args('quoteId') quoteId: string,
  ) {
    return this.quoteService.addToFavorites(user.userId, quoteId);
  }

  @Mutation(() => Boolean)
  removeFromFavorites(
    @AuthUser() user: { userId: number },
    @Args('quoteId') quoteId: string,
  ) {
    return this.quoteService.removeFromFavorites(user.userId, quoteId);
  }

  @Query(() => Boolean)
  isFavorite(
    @AuthUser() user: { userId: number },
    @Args('quoteId') quoteId: string,
  ) {
    return this.quoteService.isFavorite(user.userId, quoteId);
  }


  @Query(() => [Quote])
  async myFavoriteQuotes(
    @AuthUser() user: { userId: number; email: string },
  ) {
    return this.quoteService.getMyFavoriteQuotes(user.userId);
  }

 @Mutation(() => ProjectDTO)
async acceptQuoteBid(
  @AuthUser() user: { userId: number; email: string },
  @Args('bidId') bidId: string,
) {
  return this.quoteService.acceptQuoteBid(bidId, user.userId);
}



}
