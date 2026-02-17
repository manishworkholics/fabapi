import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class EMSService {
  constructor(private readonly prisma: PrismaService) {}
  async findAllEMS() {
    const user = await this.prisma.user.findMany({
      where: {
        role: 'EMS',
        isDisabled: false,
        profile: {
          NOT: {
            location: null,
          },
        },
      },
      include: {
        profile: true,
      },
    });

    const ems = user.map((emsItem) => ({
      ...emsItem,
      location: emsItem.profile?.location,
      EMSAvailabilityStatus: emsItem.profile?.EMSAvailabilityStatus,
      profile: undefined,
    }));
    return ems;
  }

  async findAvailableEMS() {
    const user = await this.prisma.user.findMany({
      where: {
        role: 'EMS',
        profile: {
          is: {
            EMSAvailabilityStatus: {
              in: ['ACTIVE', 'OPEN'],
            },
          },
        },
      },
      include: {
        profile: true,
      },
    });

    const ems = user.map((emsItem) => ({
      ...emsItem,
      location: emsItem.profile?.location,
      EMSAvailabilityStatus: emsItem.profile?.EMSAvailabilityStatus,
      profile: undefined,
    }));
    return ems;
  }

  emsDetails(id: number) {
    return this.prisma.user.findUnique({
      where: {
        id: id,
        role: 'EMS',
      },
      include: {
        profile: {
          select: {
            location: true,
            EMSAvailabilityStatus: true,
          },
        },
      },
    });
  }

  // EMS Manufacturer methods
  async findAllManufacturers() {
    return await this.prisma.eMSManufacturer.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findManufacturerById(id: number) {
    return await this.prisma.eMSManufacturer.findUnique({
      where: { id },
    });
  }

  async searchManufacturers(query: string) {
    return await this.prisma.eMSManufacturer.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
          { certifications: { contains: query, mode: 'insensitive' } },
          { industries: { contains: query, mode: 'insensitive' } },
          { emsType: { contains: query, mode: 'insensitive' } },
        ],
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findManufacturersByLocation(location: string) {
    return await this.prisma.eMSManufacturer.findMany({
      where: {
        location: {
          contains: location,
          mode: 'insensitive',
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  // Query only manufacturers (EMS Type contains "Manufacturer")
  async findOnlyManufacturers() {
    return await this.prisma.eMSManufacturer.findMany({
      where: {
        emsType: {
          contains: 'Manufacturer',
          mode: 'insensitive',
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  // Query only suppliers (EMS Type contains "Supplier")
  async findOnlySuppliers() {
    return await this.prisma.eMSManufacturer.findMany({
      where: {
        emsType: {
          contains: 'Supplier',
          mode: 'insensitive',
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  // Query manufacturers by location
  async findManufacturersByLocationAndType(location: string) {
    return await this.prisma.eMSManufacturer.findMany({
      where: {
        location: {
          contains: location,
          mode: 'insensitive',
        },
        emsType: {
          contains: 'Manufacturer',
          mode: 'insensitive',
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  // Query suppliers by location
  async findSuppliersByLocation(location: string) {
    return await this.prisma.eMSManufacturer.findMany({
      where: {
        location: {
          contains: location,
          mode: 'insensitive',
        },
        emsType: {
          contains: 'Supplier',
          mode: 'insensitive',
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}
