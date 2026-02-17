import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import { AdminRegisterInput } from './dto/admin-register.input';
import { AdminLoginInput } from './dto/admin-login.input';
import * as bcrypt from 'bcrypt';
import { UserRole } from 'src/common/enums/user-role.enum';
import { AdminDashboard } from './dto/admin-dashboard.type';
import { AdminUsersInput } from './dto/admin-users.input';
import { AdminUsersResponse } from './dto/admin-users.type';
import { AdminToggleUserInput } from './dto/admin-toggle-user.input';
import { AdminEMSListInput } from './dto/admin-ems-list.input';
import { AdminEMSListResponse } from './dto/admin-ems-list.type';
import { AdminToggleCompanyInput } from './dto/admin-toggle-company.input';
import { AdminRFQListInput } from './dto/admin-rfq-list.input';
import { AdminRFQListResponse } from './dto/admin-rfq-list.type';
import { AdminProjectListInput } from './dto/admin-project-list.input';
import { AdminProjectListResponse } from './dto/admin-project-list.type';
import { AdminBidListInput } from './dto/admin-bid-list.input';
import { AdminBidListResponse } from './dto/admin-bid-list.type';


@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  async register(data: AdminRegisterInput) {
    if (data.adminSecret !== process.env.ADMIN_SECRET) {
      throw new ForbiddenException('Invalid admin secret');
    }

    const hashed = await bcrypt.hash(data.password, 10);

    const admin = await this.prisma.user.create({
      data: {
        firstName: data.name,
        email: data.email,
        hashedPassword: hashed,
        role: UserRole.ADMIN,
      },
    });

    return admin;
  }

  async login(data: AdminLoginInput) {
    const admin = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!admin || admin.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const match = await bcrypt.compare(data.password, admin.hashedPassword);
    if (!match) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({
      userId: admin.id,
      role: admin.role,
    });


    return { accessToken: token };
  }

  async getDashboard(): Promise<AdminDashboard> {
    const [
      totalUsers,
      totalEMS,
      totalPM,
      totalRFQs,
      totalProjects,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: UserRole.EMS } }),
      this.prisma.user.count({ where: { role: UserRole.PM } }),
      this.prisma.quote.count(),
      this.prisma.project.count(),
    ]);

    return {
      totalUsers,
      totalEMS,
      totalPM,
      totalRFQs,
      totalProjects,
    };
  }


  async getUsers(input: AdminUsersInput): Promise<AdminUsersResponse> {
    const { page, limit, role } = input;

    const where = role ? { role } : {};


    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users: users.map(u => ({
        ...u,
        role: u.role as UserRole,
      })),
      total,
    };

  }


  async toggleUserStatus(input: AdminToggleUserInput) {
    const { userId, isDisabled } = input;

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { isDisabled },
    });

    return user;
  }

  async getEMSCompanies(input: AdminEMSListInput): Promise<AdminEMSListResponse> {
    const { page, limit } = input;

    // const where = { type: 'EMS' };

    const [companies, total] = await Promise.all([
      this.prisma.company.findMany({
        // where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.company.count({}),
    ]);

    return { companies, total };
  }


  async toggleCompanyStatus(input: AdminToggleCompanyInput) {
    const { companyId, isDisabled } = input;

    return this.prisma.company.update({
      where: { id: companyId },
      data: { isDisabled },
    });
  }


  async getRFQs(input: AdminRFQListInput): Promise<AdminRFQListResponse> {
    const { page, limit } = input;

    const [rfqs, total] = await Promise.all([
      this.prisma.quote.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          quoteName: true,
          createdAt: true,
          userId: true,
        },
      }),
      this.prisma.quote.count(),
    ]);

    return { rfqs, total };
  }

  async getProjects(input: AdminProjectListInput): Promise<AdminProjectListResponse> {
    const { page, limit } = input;

    const [projects, total] = await Promise.all([
      this.prisma.project.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          quoteId: true,
          pmId: true,
          emsId: true,
          status: true,
          createdAt: true,
        },

      }),
      this.prisma.project.count(),
    ]);

    return { projects, total };
  }

  async getBids(input: AdminBidListInput): Promise<AdminBidListResponse> {
    const { page, limit } = input;

    const [bids, total] = await Promise.all([
      this.prisma.quoteEMSBid.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          bidderId: true,
          quoteId: true,
          createdAt: true,
        },

      }),
      this.prisma.quoteEMSBid.count(),
    ]);

    return { bids, total };
  }



}
