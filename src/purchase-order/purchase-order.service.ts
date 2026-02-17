import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PurchaseOrderService {
  constructor(private prisma: PrismaService) { }

  async createFromBid(projectId: number, bid: any, quote: any) {

    // ✅ 1. Prevent duplicate PO
    const existingPO = await this.prisma.purchaseOrder.findUnique({
      where: { projectId },
    });

    if (existingPO) {
      return existingPO;
    }

    // ✅ 2. Parse pricing
    const pricing = JSON.parse(bid.message || '{}');
    const items = pricing.pricingBreakdown || [];

    const subtotal = items.reduce((s, i) => s + (i.totalPrice || 0), 0);
    const tax = 0;
    const total = subtotal + tax;

    // ✅ 3. Create once
    return this.prisma.purchaseOrder.create({
      data: {
        projectId,
        quoteId: bid.quoteId,
        bidId: bid.id,
        pmId: quote.userId,
        emsId: bid.bidderId,
        vendorName: bid.bidder?.profile?.companyName || 'EMS Vendor',
        items,
        subtotal,
        tax,
        total,
      },
    });
  }

  async getByProject(projectId: any) {
    return this.prisma.purchaseOrder.findUnique({
      where: { projectId },
    });
  }

  async getPurchaseOrderByQuoteId(quoteId: string) {
    return this.prisma.purchaseOrder.findFirst({
      where: { quoteId },
      include: {
        project: {
          include: {
            pm: true,
            ems: true,
            quote: true,
          },
        },
      },
    });
  }


}
