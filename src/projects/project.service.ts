import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ProjectService {
  constructor(private readonly prisma: PrismaService) { }

  // ✅ EMS Project List
  async getProjectsForEMS(emsUserId: number) {
    return this.prisma.project.findMany({
      where: {
        emsId: emsUserId,
      },
      include: {
        quote: true,
        pm: true,
        ems: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getProjectDetail(projectId: number, userId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        quote: true,
        pm: true,
        ems: true,
        purchaseOrder: true,
        history: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Optional security check
    if (project.pmId !== userId && project.emsId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return project;
  }

  async updateProjectStatus(
    projectId: number,
    emsUserId: number,
    status: ProjectStatus,
    note?: string,
  ) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Only EMS assigned to project can update
    if (project.emsId !== emsUserId) {
      throw new ForbiddenException('Only assigned EMS can update project status');
    }

    // Update project status
    const updatedProject = await this.prisma.project.update({
      where: { id: projectId },
      data: { status },
      include: {
        quote: true,
        pm: true,
        ems: true,
        purchaseOrder: true,
        history: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });


    // Insert history record
    await this.prisma.projectStatusHistory.create({
      data: {
        projectId,
        status,
        note,
      },
    });

    return updatedProject;
  }


  async getProjectTimeline(projectId: number, userId: number) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    if (project.pmId !== userId && project.emsId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return this.prisma.projectStatusHistory.findMany({
      where: { projectId },
      orderBy: { createdAt: 'asc' },
    });
  }



}
