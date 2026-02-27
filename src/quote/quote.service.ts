import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateQuoteInput } from './dto/create-quote.input';
import { UpdateQuoteInput } from './dto/update-quote.input';
import { PrismaService } from 'src/prisma/prisma.service';
import { FindAllQuotesInput } from './dto/find-all-quote.input';
import { Prisma } from '@prisma/client';
import { PlaceBidInput } from './dto/place-bid-input';
import { DetailedBidInput } from './dto/detailed-bid.input';
import { generateUId } from 'src/utils/helpers';
import { ProjectService } from 'src/project/project.service';
import { PurchaseOrderService } from '../purchase-order/purchase-order.service';
import { MailService } from 'src/mail/mail.service';


@Injectable()
export class QuoteService {
  [x: string]: any;
  constructor(
    private readonly prisma: PrismaService,
    private mailService: MailService,
    private readonly projectService: ProjectService,
    private readonly purchaseOrderService: PurchaseOrderService,
  ) { }


  async foundUser(id: number) {
    return await this.prisma.user.findUnique({ where: { id } });
  }

  async findAllQuote(
    params?: FindAllQuotesInput,
    user?: { userId: number; role: string },
  ) {
    const {
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
      filters,
    } = params || {};

    const whereClauses: Prisma.QuoteWhereInput[] = [{ isDraft: false }];

    // 🔐 Restrict PM access
    if (user?.role === 'PM') {
      whereClauses.push({
        OR: [{ userId: user?.userId }, { assignedEMSId: user?.userId }],
      });
    }

    if (filters) {
      whereClauses.push(filters);
    }

    const where = whereClauses.length > 0 ? { AND: whereClauses } : undefined;

    const orderBy = [{ [sortBy]: sortOrder }];

    const skip = (page - 1) * limit;

    const [quotes, totalCount] = await Promise.all([
      this.prisma.quote.findMany({
        where,
        include: {
          bids: true,
          user: true,
          assignedEMS: true,
        },
        orderBy: orderBy as Prisma.QuoteOrderByWithRelationInput[],
        skip,
        take: limit,
      }),
      this.prisma.quote.count({ where }),
    ]);

    return {
      quotes,
      totalCount,
    };
  }

  async signNDA(quoteId: string, userId: number) {
    const quote = await this.prisma.quote.findUnique({
      where: { quoteId },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found');
    }

    if (!quote.hasNDA) {
      throw new BadRequestException('This quote does not require an NDA');
    }

    const user = await this.foundUser(userId);

    if (user?.role !== 'EMS') {
      throw new ForbiddenException('Only EMS users can sign an NDA');
    }

    const quoteNDA = await this.prisma.quoteNDA.findUnique({
      where: {
        quoteId_userId: {
          quoteId,
          userId: user.id,
        },
      },
    });

    if (quoteNDA) {
      return true;
    }

    await this.prisma.quoteNDA.create({
      data: {
        quoteId: quote.quoteId,
        userId: user.id,
        signedNDA: true,
      },
    });

    return true;
  }

  async findOneQuote(quoteId: string, userId: number) {
    const quote = await this.prisma.quote.findUnique({
      where: { quoteId },
      include: {
        bids: true,
        user: true,
        assignedEMS: true,
        project: true,
      },
    });

    if (!quote) throw new NotFoundException('Quote not found');

    const user = await this.foundUser(userId);

    if (quote.hasNDA && user?.role === 'EMS') {
      const response = await this.prisma.quoteNDA.findFirst({
        where: {
          quote: { quoteId },
          userId: user.id,
          signedNDA: true,
        },
      });

      return { ...quote, userSignedNDA: response?.signedNDA ?? false };
    }

    return quote;
  }

  async findMyQuotes(
    params?: FindAllQuotesInput,
    user?: { userId: number; role: string },
  ) {
    const {
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 10,
      filters,
    } = params || {};

    const whereClauses: Prisma.QuoteWhereInput[] = [{ isDraft: false }];

    // 🔐 Restrict PM access
    if (user?.role === 'PM') {
      whereClauses.push({
        OR: [{ userId: user?.userId }, { assignedEMSId: user?.userId }],
      });
    }

    if (filters) {
      whereClauses.push(filters);
    }

    const where = whereClauses.length > 0 ? { AND: whereClauses } : undefined;

    const orderBy = [{ [sortBy]: sortOrder }];

    const skip = (page - 1) * limit;

    const [quotes, totalCount] = await Promise.all([
      this.prisma.quote.findMany({
        where: {
          userId: user?.userId,
          ...(where ? where : {}),
        },
        include: {
          bids: {
            include: { bidder: true }
          },
          user: true,
          assignedEMS: true,
        },
        orderBy: orderBy as Prisma.QuoteOrderByWithRelationInput[],
        skip,
        take: limit,
      }),
      this.prisma.quote.count({ where }),
    ]);

    return {
      quotes,
      totalCount,
    };
  }

  async findMyDraftQuotes(userId: number) {
    return await this.prisma.quote.findMany({
      where: {
        userId,
        isDraft: true,
      },
      include: {
        bids: true,
        user: true,
        assignedEMS: true,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async findMyDraftQuoteById(userId: number, quoteId: string) {
    return await this.prisma.quote.findFirst({
      where: {
        quoteId,
        userId,
        isDraft: true,
      },
      include: {
        bids: true,
        user: true,
        assignedEMS: true,
      },
    });
  }

  // async createQuote(userId: number, createQuoteInput: CreateQuoteInput) {
  //   if (createQuoteInput.assignedEMSId) {
  //     const EMS = await this.foundUser(createQuoteInput.assignedEMSId);
  //     if (!EMS) throw new NotFoundException('Invalid EMS Id!');
  //   }

  //   const user = await this.prisma.user.findUnique({
  //     where: { id: userId },
  //     include: { company: true },
  //   });

  //   const quoteId = generateUId(user?.company?.name);

  //   return await this.prisma.quote.create({
  //     data: {
  //       quoteId,
  //       user: { connect: { id: userId } },
  //       title: createQuoteInput.title,
  //       description: createQuoteInput.description,
  //       quoteMaterials: createQuoteInput.quoteMaterials,
  //       pcbBoards: createQuoteInput.pcbBoards,
  //       stencils: createQuoteInput.stencils,
  //       components: createQuoteInput.components,
  //       turnTime: createQuoteInput.turnTime,
  //       quoteFiles: createQuoteInput.quoteFiles,
  //       quoteName: createQuoteInput.quoteName,
  //       budget: createQuoteInput.budget,
  //       quoteType: createQuoteInput.quoteType,
  //       assignedEMS: createQuoteInput.assignedEMSId
  //         ? { connect: { id: createQuoteInput.assignedEMSId } }
  //         : undefined,
  //       status: createQuoteInput.assignedEMSId ? 'ASSIGNED' : 'PENDING',
  //       hasNDA: createQuoteInput.hasNDA,
  //       isDraft: createQuoteInput.isDraft ?? false,
  //       numberOfBoards: createQuoteInput.numberOfBoards,
  //     },
  //     include: {
  //       bids: true,
  //       user: true,
  //       assignedEMS: true,
  //     },
  //   });

  //   await this.mailService.sendQuoteSubmittedToPM(
  //     user.email,
  //     user.firstName ?? 'User',
  //     quote.id,
  //     quote.quoteName,
  //   );
  // }


  async createQuote(userId: number, createQuoteInput: CreateQuoteInput) {
    if (createQuoteInput.assignedEMSId) {
      const EMS = await this.foundUser(createQuoteInput.assignedEMSId);
      if (!EMS) throw new NotFoundException('Invalid EMS Id!');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const quoteId = generateUId(user?.company?.name);

    const quote = await this.prisma.quote.create({
      data: {
        quoteId,
        user: { connect: { id: userId } },
        title: createQuoteInput.title,
        description: createQuoteInput.description,
        quoteMaterials: createQuoteInput.quoteMaterials,
        pcbBoards: createQuoteInput.pcbBoards,
        stencils: createQuoteInput.stencils,
        components: createQuoteInput.components,
        turnTime: createQuoteInput.turnTime,
        quoteFiles: createQuoteInput.quoteFiles,
        quoteName: createQuoteInput.quoteName,
        budget: createQuoteInput.budget,
        quoteType: createQuoteInput.quoteType,
        assignedEMS: createQuoteInput.assignedEMSId
          ? { connect: { id: createQuoteInput.assignedEMSId } }
          : undefined,
        status: createQuoteInput.assignedEMSId ? 'ASSIGNED' : 'PENDING',
        hasNDA: createQuoteInput.hasNDA,
        isDraft: createQuoteInput.isDraft ?? false,
        numberOfBoards: createQuoteInput.numberOfBoards,
      },
      include: {
        bids: true,
        user: true,
        assignedEMS: true,
      },
    });

    // ✅ Non-blocking email (best practice)
    this.mailService
      .sendQuoteSubmittedToPM(
        user.email, // no optional chaining
        user.firstName ?? 'User',
        quote.quoteId,
        quote.quoteName,
      )
      .catch((err) => {
        console.error('Quote submission email failed:', err);
      });

    // ✅ If quote assigned directly to EMS → notify that EMS
    // if (quote.user?.email) {
    //   this.mailService
    //     .notifyDirectEMSQuote(
    //       quote.user.email,
    //       quote.quoteId,
    //       quote.title,
    //     )
    //     .catch((err) => {
    //       console.error('Direct EMS notification failed:', err);
    //     });
    // }


    if (quote.assignedEMS) {
      this.mailService
        .notifyEMSNewQuote(
          quote.assignedEMS.email,
          quote.quoteId,
          quote.quoteName,
        )
        .catch(console.error);
    }

    return quote;
  }

  async updateQuote(quoteId: string, updateQuoteInput: UpdateQuoteInput) {
    if (updateQuoteInput.assignedEMSId) {
      const EMS = await this.foundUser(updateQuoteInput.assignedEMSId);
      if (!EMS) throw new NotFoundException('Invalid EMS Id!');
    }
    const quote = await this.prisma.quote.findUnique({ where: { quoteId } });
    if (!quote) throw new NotFoundException('Quote not found!');

    return await this.prisma.quote.update({
      where: { quoteId },
      data: {
        title: updateQuoteInput.title,
        description: updateQuoteInput.description,
        quoteMaterials: updateQuoteInput.quoteMaterials,
        pcbBoards: updateQuoteInput.pcbBoards,
        stencils: updateQuoteInput.stencils,
        components: updateQuoteInput.components,
        turnTime: updateQuoteInput.turnTime,
        quoteFiles: updateQuoteInput.quoteFiles,
        budget: updateQuoteInput.budget,
        quoteType: updateQuoteInput.quoteType,
        assignedEMS: updateQuoteInput.assignedEMSId
          ? { connect: { id: updateQuoteInput.assignedEMSId } }
          : { disconnect: true },
        status: updateQuoteInput.assignedEMSId ? 'ASSIGNED' : 'PENDING',
        hasNDA: true,
      },
      include: {
        bids: true,
        user: true,
        assignedEMS: true,
      },
    });
  }

  async archiveQuote(quoteId: string) {
    let message = `Quote could not be archieved!`;

    const quote = await this.prisma.quote.findUnique({ where: { quoteId } });
    if (!quote) throw new NotFoundException('Quote not found!');

    const status = await this.prisma.quote.update({
      where: {
        quoteId,
      },
      data: {
        isArchived: true,
      },
    });
    if (status) {
      message = `Quotes archived successfully.`;
    }

    return { status: status ? 'success' : 'failed', message };
  }

  async deleteQuote(quoteId: string) {
    let message = `Quote could not be deleted!`;

    const quote = await this.prisma.quote.findUnique({ where: { quoteId } });
    if (!quote) throw new NotFoundException('Quote not found!');

    const status = await this.prisma.quote.delete({
      where: {
        quoteId,
      },
    });

    if (status) {
      message = `Quote deleted successfully.`;
    }

    return { status: status ? 'success' : 'failed', message };
  }

  // quote bidding

  // async placeBid(
  //   quoteId: string,
  //   bidderId: number,
  //   placeBidInput: PlaceBidInput,
  // ) {
  //   const quote = await this.prisma.quote.findUnique({
  //     where: { quoteId },
  //   });

  //   if (!quote) {
  //     throw new NotFoundException('Quote not found.');
  //   }

  //   const existingBid = await this.prisma.quoteEMSBid.findFirst({
  //     where: {
  //       quoteId: quoteId,
  //       bidderId: bidderId,
  //     },
  //   });

  //   if (existingBid) {
  //     throw new ForbiddenException(
  //       'You have already placed a bid on this quote.',
  //     );
  //   }

  //   return this.prisma.quoteEMSBid.create({
  //     data: {
  //       quoteId,
  //       bidderId: bidderId,
  //       amount: placeBidInput.amount,
  //       message: placeBidInput.message,
  //     },
  //   });
  // }



  async placeBid(
    quoteId: string,
    bidderId: number,
    placeBidInput: PlaceBidInput,
  ) {
    const quote = await this.prisma.quote.findUnique({
      where: { quoteId },
      include: { user: true }, // 👈 include PM user
    });

    if (!quote) {
      throw new NotFoundException('Quote not found.');
    }

    const existingBid = await this.prisma.quoteEMSBid.findFirst({
      where: {
        quoteId: quoteId,
        bidderId: bidderId,
      },
    });

    if (existingBid) {
      throw new ForbiddenException(
        'You have already placed a bid on this quote.',
      );
    }

    const bid = await this.prisma.quoteEMSBid.create({
      data: {
        quoteId,
        bidderId: bidderId,
        amount: placeBidInput.amount,
        message: placeBidInput.message,
      },
    });

    // ✅ Send email to PM (non-blocking)
    if (quote.user?.email) {
      this.mailService
        .notifyPMBidReceived(
          quote.user.email,
          quote.user.firstName ?? 'User',
          quote.quoteId,
          quote.quoteName,
        )
        .catch((err) => {
          console.error('Bid notification email failed:', err);
        });
    }



    return bid;
  }

  async placeDetailedBid(
    quoteId: string,
    bidderId: number,
    detailedBidInput: DetailedBidInput,
  ) {
    const quote = await this.prisma.quote.findUnique({
      where: { quoteId },
    });

    if (!quote) {
      throw new NotFoundException('Quote not found.');
    }

    const existingBid = await this.prisma.quoteEMSBid.findFirst({
      where: {
        quoteId: quoteId,
        bidderId: bidderId,
      },
    });

    if (existingBid) {
      throw new ForbiddenException(
        'You have already placed a bid on this quote.',
      );
    }

    // Calculate total estimated cost from pricing breakdown
    const totalEstimatedCost = detailedBidInput.pricingBreakdown.reduce(
      (total, item) => total + item.totalPrice,
      0,
    );

    // Store detailed bid information as structured JSON in the message field
    const detailedBidData = {
      type: 'detailed_bid',
      projectApproach: {
        relevantExperience: detailedBidInput.relevantExperience,
        technicalApproach: detailedBidInput.technicalApproach,
        estimatedTimeline: detailedBidInput.estimatedTimeline,
      },
      pricingBreakdown: detailedBidInput.pricingBreakdown,
      totalEstimatedCost,
      additionalNotes: detailedBidInput.additionalNotes,
    };

    return this.prisma.quoteEMSBid.create({
      data: {
        quoteId,
        bidderId: bidderId,
        amount: totalEstimatedCost,
        message: JSON.stringify(detailedBidData),
      },
    });
  }

  async getDetailedBidById(bidId: string) {
    const bid = await this.prisma.quoteEMSBid.findUnique({
      where: { id: bidId },
      include: {
        bidder: true,
        quote: true,
      },
    });

    if (!bid) {
      throw new NotFoundException('Bid not found.');
    }

    // Try to parse the message as detailed bid data
    try {
      const detailedBidData = JSON.parse(bid.message || '{}') as {
        type?: string;
        projectApproach?: any;
        pricingBreakdown?: any;
        totalEstimatedCost?: number;
        additionalNotes?: string;
      };

      return {
        ...bid,
        ...detailedBidData,
      };
    } catch {
      // If parsing fails, treat as regular bid
    }

    return bid;
  }

  async getDetailedBidsForQuote(quoteId: string) {
    const bids = await this.prisma.quoteEMSBid.findMany({
      where: { quoteId },
      include: {
        bidder: true,
        quote: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return bids.map((bid) => {
      try {
        const detailedBidData = JSON.parse(bid.message || '{}') as {
          type?: string;
          projectApproach?: any;
          pricingBreakdown?: any;
          totalEstimatedCost?: number;
          additionalNotes?: string;
        };

        return {
          ...bid,
          ...detailedBidData,
        };
      } catch {
        // If parsing fails, treat as regular bid
      }

      return bid;
    });
  }

  /**
   * Create a quick quotation for an ingested application
   * This is automatically called when an ingestion job completes
   */
  async createQuickQuotation(
    userId: number,
    ingestionJobId: string,
    sourceUrl: string,
  ) {
    // Check if a quick quotation already exists for this ingestion job
    const existingQuote = await this.prisma.quote.findFirst({
      where: { ingestionJobId },
    });

    if (existingQuote) {
      return existingQuote;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Generate a unique quote ID
    const quoteId = generateUId(user?.company?.name);

    // Extract filename from source URL for the quote name
    const fileName = sourceUrl.split('/').pop() || 'Ingested Application';
    const quoteName = fileName.replace('.zip', '');

    // Create the quick quotation
    const quickQuote = await this.prisma.quote.create({
      data: {
        quoteId,
        userId,
        quoteName,
        title: `Quick Quote: ${quoteName}`,
        description: `Auto-generated quick quotation for ingested application from ${sourceUrl}`,
        quoteType: 'QUICK_QUOTE',
        status: 'PENDING',
        budget: 0, // Default budget, can be updated by user later
        turnTime: 0, // Default turn time
        quoteMaterials: [],
        quoteFiles: [],
        isDraft: false,
        ingestionJobId,
      },
      include: {
        bids: true,
        user: true,
        assignedEMS: true,
      },
    });

    return quickQuote;
  }

  /**
   * Get quick quotations for a user
   */
  async findQuickQuotations(userId: number) {
    return await this.prisma.quote.findMany({
      where: {
        userId,
        quoteType: 'QUICK_QUOTE',
      },
      include: {
        bids: true,
        user: true,
        assignedEMS: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }



  // async acceptQuoteBid(bidId: string, pmUserId: number) {
  //   const bid = await this.prisma.quoteEMSBid.findUnique({
  //     where: { id: bidId },
  //     include: { quote: true },
  //   });

  //   if (!bid) throw new NotFoundException('Bid not found');

  //   if (bid.quote.userId !== pmUserId) {
  //     throw new ForbiddenException('Only quote owner can accept bid');
  //   }

  //   // Update quote → assign EMS + mark as ASSIGNED
  //   await this.prisma.quote.update({
  //     where: { quoteId: bid.quoteId },
  //     data: {
  //       status: 'ASSIGNED',
  //       assignedEMSId: bid.bidderId,
  //     },
  //   });

  //   // Create project
  //   const project = await this.projectService.createProjectFromBid(bidId);

  //   return project;
  // }


  // async acceptQuoteBid(bidId: string, pmUserId: number) {
  //   const bid = await this.prisma.quoteEMSBid.findUnique({
  //     where: { id: bidId },
  //     include: { quote: true },
  //   });

  //   if (!bid) throw new NotFoundException('Bid not found');

  //   if (bid.quote.userId !== pmUserId) {
  //     throw new ForbiddenException('Only quote owner can accept bid');
  //   }

  //   await this.prisma.quote.update({
  //     where: { quoteId: bid.quoteId },
  //     data: {
  //       status: 'ASSIGNED',
  //       assignedEMSId: bid.bidderId,
  //     },
  //   });

  //   return true;
  // }


  async acceptQuoteBid(bidId: string, pmUserId: number) {
    const bid = await this.prisma.quoteEMSBid.findUnique({
      where: { id: bidId },
      include: {
        quote: true,
        bidder: true, // optional (for vendor name)
      },
    });

    if (!bid) throw new NotFoundException('Bid not found');

    if (bid.quote.userId !== pmUserId) {
      throw new ForbiddenException('Only quote owner can accept bid');
    }

    // 1️⃣ Update quote → assign EMS
    await this.prisma.quote.update({
      where: { quoteId: bid.quoteId },
      data: {
        status: 'ASSIGNED',
        assignedEMSId: bid.bidderId,
      },
    });

    // 2️⃣ Create project
    const project = await this.projectService.createProjectFromBid(bidId);

    // 3️⃣ Create purchase order
    await this.purchaseOrderService.createFromBid(
      project.id,   // Int
      bid,
      bid.quote,
    );

    // 4️⃣ Return project
    return project;
  }


  async withdrawQuoteBid(bidId: string, emsUserId: number) {
    const bid = await this.prisma.quoteEMSBid.findUnique({
      where: { id: bidId }
    })

    if (!bid) throw new NotFoundException('Bid not found');

    if (bid.bidderId !== emsUserId) {
      throw new ForbiddenException('You can only withdraw your own bid')
    }

    await this.prisma.quoteEMSBid.delete({
      where: { id: bidId }
    })

    return true
  }


  async getMyBids(emsUserId: number) {
    return this.prisma.quoteEMSBid.findMany({
      where: {
        bidderId: emsUserId,
      },
      include: {
        quote: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }


  async getOpenQuotesForEMS() {
    return this.prisma.quote.findMany({
      where: {
        status: 'PENDING',
        isDraft: false,
        isArchived: false,
      },
      include: {
        user: true,        // PM info
        bids: true,        // existing bids (optional)
        assignedEMS: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }



  //............................... favorite...............................


  // Add to favorites
  async addToFavorites(userId: number, quoteId: string) {
    const quote = await this.prisma.quote.findUnique({ where: { quoteId } });
    if (!quote) throw new NotFoundException('Quote not found');

    const exists = await this.prisma.FavoriteQuote.findUnique({
      where: { userId_quoteId: { userId, quoteId } },
    });

    if (exists) return true;

    await this.prisma.FavoriteQuote.create({
      data: { userId, quoteId },
    });

    return true;
  }

  // Remove from favorites
  async removeFromFavorites(userId: number, quoteId: string) {
    await this.prisma.FavoriteQuote.deleteMany({
      where: { userId, quoteId },
    });

    return true;
  }

  // Check is favorite
  async isFavorite(userId: number, quoteId: string) {
    const fav = await this.prisma.FavoriteQuote.findUnique({
      where: { userId_quoteId: { userId, quoteId } },
    });

    return !!fav;
  }


  async getMyFavoriteQuotes(userId: number) {
    const favorites = await this.prisma.FavoriteQuote.findMany({
      where: { userId },
      include: {
        quote: {
          include: {
            bids: true,
            user: true,
            assignedEMS: true,
          },
        },
      },
      orderBy: {
        id: 'desc',
      },
    });

    // Only return quotes
    return favorites.map(f => f.quote);
  }



}
