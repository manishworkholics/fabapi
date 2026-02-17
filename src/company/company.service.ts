import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class CompanyService {
  constructor(private readonly prisma: PrismaService) {}
  async findAllCompanies(query?: string) {
    return this.prisma.company.findMany({
      where: query
        ? { name: { contains: query, mode: 'insensitive' } }
        : undefined,
      take: 10,
    });
  }
}
