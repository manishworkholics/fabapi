import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { CompleteProfileInput } from './dto/complete-profile.input';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) { }

  async completeEMSProfile(userId: number, input: CompleteProfileInput) {
    return this.prisma.profile.upsert({
      where: { userId },
      update: {
        phone: input.phone,
        location: input.location,
        jobRole: input.jobRole,
        projectBuildType: input.projectBuildType,
        EMSAvailabilityStatus: input.EMSAvailabilityStatus,


        companyName: input.companyName,
        establishedYear: input.establishedYear,
        employeeRange: input.employeeRange,
        certifications: input.certifications ?? [],
        specialties: input.specialties ?? [],
        manufacturingCapabilities: input.manufacturingCapabilities ?? [],
        equipmentList: input.equipmentList ?? [],
        facilityVideoUrl: input.facilityVideoUrl,
      },
      create: {
        userId,
        phone: input.phone,
        location: input.location,
        jobRole: input.jobRole,
        projectBuildType: input.projectBuildType,
        EMSAvailabilityStatus: input.EMSAvailabilityStatus,

        companyName: input.companyName,
        establishedYear: input.establishedYear,
        employeeRange: input.employeeRange,
        certifications: input.certifications ?? [],
        specialties: input.specialties ?? [],
        manufacturingCapabilities: input.manufacturingCapabilities ?? [],
        equipmentList: input.equipmentList ?? [],
        facilityVideoUrl: input.facilityVideoUrl,
      },
    });
  }

  async getAllEMS() {
    const users = await this.prisma.user.findMany({
      where: { role: 'EMS' },
      include: { profile: true },
    });

    // ⭐ NEW — reviews aggregation
    const reviewStats = await this.prisma.review.groupBy({
      by: ['emsId'],
      _avg: { rating: true },
      _count: { rating: true },
    });

    const statsMap = new Map(
      reviewStats.map((r) => [
        r.emsId,
        {
          rating: r._avg.rating ?? 0,
          reviewCount: r._count.rating ?? 0,
        },
      ]),
    );

    return users.map((u) => {
      const stats = statsMap.get(u.id) || {
        rating: 0,
        reviewCount: 0,
      };

      return {
        id: u.id,

        companyName: u.profile?.companyName || u.username,
        location: u.profile?.location,
        bio: u.profile?.bio,

        establishedYear: u.profile?.establishedYear,
        employeeRange: u.profile?.employeeRange,

        certifications: u.profile?.certifications ?? [],
        specialties: u.profile?.specialties ?? [],
        manufacturingCapabilities: u.profile?.manufacturingCapabilities ?? [],
        equipmentList: u.profile?.equipmentList ?? [],

        facilityVideoUrl: u.profile?.facilityVideoUrl,

        EMSAvailabilityStatus: u.profile?.EMSAvailabilityStatus,
        jobRole: u.profile?.jobRole,
        projectBuildType: u.profile?.projectBuildType,

        // ⭐ ONLY THESE TWO ADDED
        rating: stats.rating,
        reviewCount: stats.reviewCount,
      };
    });
  }



  async getEMSById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!user || user.role !== 'EMS') return null;

    return {
      id: user.id,
      companyName: user.profile?.companyName || user.username,  // ✅ FIXED
      location: user.profile?.location,
      jobRole: user.profile?.jobRole,
      projectBuildType: user.profile?.projectBuildType,
      EMSAvailabilityStatus: user.profile?.EMSAvailabilityStatus,
    };
  }


  async getFullEMSDetailById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,

      },
    });

    if (!user || user.role !== 'EMS') return null;

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,

      companyName: user.profile?.companyName,
      location: user.profile?.location,
      bio: user.profile?.bio,
      establishedYear: user.profile?.establishedYear,
      employeeRange: user.profile?.employeeRange,

      certifications: user.profile?.certifications ?? [],
      specialties: user.profile?.specialties ?? [],
      manufacturingCapabilities: user.profile?.manufacturingCapabilities ?? [],
      equipmentList: user.profile?.equipmentList ?? [],

      facilityVideoUrl: user.profile?.facilityVideoUrl,
      jobRole: user.profile?.jobRole,
      projectBuildType: user.profile?.projectBuildType,
      EMSAvailabilityStatus: user.profile?.EMSAvailabilityStatus,
    };
  }




}
