import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectService {
    constructor(private prisma: PrismaService) { }

    async createProjectFromBid(bidId: string) {
        const bid = await this.prisma.quoteEMSBid.findUnique({
            where: { id: bidId },
            include: { quote: true },
        });

        if (!bid) throw new Error('Bid not found');

        // ✅ Check if project already exists
        const existingProject = await this.prisma.project.findUnique({
            where: { quoteId: bid.quoteId },
        });

        if (existingProject) {
            return existingProject;
        }

        // ✅ Create new project
        const project = await this.prisma.project.create({
            data: {
                quoteId: bid.quoteId,
                pmId: bid.quote.userId,
                emsId: bid.bidderId,
                status: 'ASSIGNED',
                history: {
                    create: {
                        status: 'ASSIGNED',
                        note: 'Project created after bid acceptance',
                    },
                },
            },
        });

        return project;
    }


    async getProjectsForPM(pmId: number) {
        return this.prisma.project.findMany({
            where: { pmId },
            include: {
                quote: true,
                ems: true,
                history: { orderBy: { createdAt: 'asc' } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async getProjectsForEMS(emsId: number) {
        return this.prisma.project.findMany({
            where: { emsId },
            include: {
                quote: true,
                pm: true,
                history: { orderBy: { createdAt: 'asc' } },
            },
            orderBy: { createdAt: 'desc' },
        });
    }


    async updateProjectStatus(
        projectId: number,
        status: 'IN_PROGRESS' | 'MANUFACTURING' | 'ON_HOLD' | 'COMPLETED',
        note?: string,
    ) {
        const project = await this.prisma.project.findUnique({
            where: { id: projectId },
        });

        if (!project) throw new Error('Project not found');

        return this.prisma.project.update({
            where: { id: projectId },
            data: {
                status,
                history: {
                    create: {
                        status,
                        note,
                    },
                },
            },
        });
    }


}
