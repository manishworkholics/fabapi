import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { User } from '@prisma/client';
import { UpdateMeInput } from './dto/update-me.input';
import { GraphQLError } from 'graphql';
import { randomUUID } from 'crypto';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async onModuleInit() {
    await this.populateMissingUserIds();
  }

  async populateMissingUserIds() {
    const usersWithoutId = await this.prisma.user.findMany({
      select: { id: true, userId: true },
      where: { userId: null },
    });

    for (const user of usersWithoutId) {
      if (!user.userId) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { userId: randomUUID() },
        });
      }
    }
  }

  async findAll() {
    return await this.prisma.user.findMany();
  }

  async find(id: number) {
    return await this.prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string) {
    const response = await this.prisma.user.findFirst({
      where: { email },
      include: {
        profile: true,
        company: true,
        quotes: true,
      },
    });
    return response;
  }

  async requestVerificationMail(email: string) {
    const user: User | null = await this.findByEmail(email);
    if (user) {
      try {
        const tokenStr = Array.from(Array(64), () =>
          Math.floor(Math.random() * 36).toString(36),
        ).join('');
        const tokenModel = await this.prisma.otp.create({
          data: {
            userId: user.id,
            token: tokenStr,
            type: 'EMAIL_VERIFICATION',
          },
        });

        await this.mailService.sendVerificationMail(
          user.email,
          tokenModel.token,
        );

        return true;
      } catch (e) {
        //todo implement loggin later
        console.log('error', e);

        return false;
      }
    }

    return false;
  }

  async markVerified(token: string) {
    const tokenModel = await this.prisma.otp.findFirst({
      where: {
        token,
        type: 'EMAIL_VERIFICATION',
      },
      include: {
        user: true,
      },
    });

    if (tokenModel) {
      await this.prisma.user.update({
        where: {
          id: tokenModel.userId,
        },
        data: {
          verifiedAt: new Date().toISOString(),
        },
      });

      return true;
    }

    return false;
  }

  async updateMe(email: string, updateMeInput: UpdateMeInput) {
    const foundUser = await this.findByEmail(email);

    if (!foundUser) {
      throw new GraphQLError(`User not found`);
    }

    return this.prisma.user.update({
      where: { email },
      data: {
        firstName: updateMeInput.firstName,
        lastName: updateMeInput.lastName,
        username: updateMeInput.username,
        phone: updateMeInput.phone,
        role: updateMeInput.userRole,
        profile: updateMeInput.profile
          ? {
              update: {
                bio: updateMeInput.profile.bio,
                location: updateMeInput.profile.location,
                jobRole: updateMeInput.profile.jobRole,
                projectBuildType: updateMeInput.profile.projectBuildType,
              },
            }
          : undefined,
      },
      include: { profile: true, company: true },
    });
  }
}
