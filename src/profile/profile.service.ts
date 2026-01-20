import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

import { CompleteProfileInput } from './dto/complete-profile.input';

@Injectable()
export class ProfileService {
  constructor(private prisma: PrismaService) { }

  // async completeEMSProfile(userId: number, input: CompleteProfileInput) {
  //   const existingProfile = await this.prisma.profile.findUnique({
  //     where: { userId },
  //   });

  //   if (existingProfile) {
  //     await this.prisma.profile.update({
  //       where: { userId },
  //       data: {
  //         phone: input.phone,
  //         location: input.location,
  //         jobRole: input.jobRole,
  //         projectBuildType: input.projectBuildType,
  //         EMSAvailabilityStatus: input.EMSAvailabilityStatus,
  //       },
  //     });
  //   } else {
  //     await this.prisma.profile.create({
  //       data: {
  //         userId,
  //         phone: input.phone,
  //         location: input.location,
  //         jobRole: input.jobRole,
  //         projectBuildType: input.projectBuildType,
  //         EMSAvailabilityStatus: input.EMSAvailabilityStatus,
  //       },
  //     });
  //   }

  //   return true;
  // }


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

    return users.map((u) => ({
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
    }));
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




}
