// src/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';

import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { AuthController } from './auth.controller';
import { AccessTokenStrategy } from './strategies/accessToken.strategy';
import { AccessTokenGuard } from './guards/accessToken.guard';

@Module({
  imports: [
    // ensure ConfigService is registered
    ConfigModule,

    // passport-jwt guard setup
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // provide JwtService configured with JWT_SECRET
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '24h' }, // adjust as needed
      }),
    }),
  ],
  providers: [
    Reflector,
    PrismaService,
    AuthService,
    AuthResolver,
    AccessTokenStrategy,
    AccessTokenGuard,
  ],
  controllers: [AuthController],
  exports: [
    // export guard to apply it in other modules
    AccessTokenGuard,
    // export JwtModule if other modules need JwtService
    JwtModule,
  ],
})
export class AuthModule {}
