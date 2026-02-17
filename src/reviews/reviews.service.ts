import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReviewInput } from './dto/create-review.input';

@Injectable()
export class ReviewsService {

    constructor(private prisma: PrismaService) { }

    // ✅ create review
    async create(pmId: number, input: CreateReviewInput) {
        return this.prisma.review.create({
            data: {
                pmId,
                emsId: input.emsId,
                rating: input.rating,
                comment: input.comment,
            },
        });
    }

    // ✅ list reviews
    async getEMSReviews(emsId: number) {
        const reviews = await this.prisma.review.findMany({
            where: { emsId },
            orderBy: { createdAt: 'desc' },
            include: {
                pm: {
                    select: {
                        firstName: true,
                        lastName: true,
                    },
                },
            },
        });

        // map reviewer name
        return reviews.map((r) => ({
            ...r,
            reviewerName: `${r.pm?.firstName ?? ''} ${r.pm?.lastName ?? ''}`,
        }));
    }

    // ✅ stats
    async getStats(emsId: number) {
        const result = await this.prisma.review.aggregate({
            where: { emsId },
            _avg: { rating: true },
            _count: true,
        });

        return {
            averageRating: result._avg.rating ?? 0,
            reviewCount: result._count,
        };
    }


}
