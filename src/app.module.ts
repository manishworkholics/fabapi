import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';

import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { PrismaService } from './prisma/prisma.service';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AppModule as ApplicationModule } from './app/app.module';

import { APP_GUARD } from '@nestjs/core';
import { AccessTokenGuard } from './auth/guards/accessToken.guard';
import './common/enums/profile.enums';
import './common/graphql/register-enums';

import { MailModule } from './mail/mail.module';
import { OtpModule } from './otp/otp.module';
import { ProfileModule } from './profile/profile.module';
import { QuoteModule } from './quote/quote.module';
import { HealthModule } from './health/health.module';
import { HealthController } from './health/health.controller';
import { EMSModule } from './ems/ems.module';
import { BomModule } from './bom/bom.module';
import { CompanyModule } from './company/company.module';
import { ProjectsModule } from './projects/projects.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { ProjectModule } from './project/project.module';
import { PurchaseOrderService } from './purchase-order/purchase-order.service';
import { PurchaseOrderResolver } from './purchase-order/purchase-order.resolver';
import { PurchaseOrderModule } from './purchase-order/purchase-order.module';
import { ReviewsModule } from './reviews/reviews.module';
import { AdminModule } from './admin/admin.module';


@Module({
  imports: [
    // 1) config system
    ConfigModule.forRoot({ isGlobal: true }),

    // 2) database
    PrismaModule,

    // 3) outbound HTTP client (for calling BOM-Checker)
    HttpModule,

    // 4) GraphQL API
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      playground: true,
      introspection: true,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      context: ({ req, res }) => ({ req, res }),
    }),

    // 5) application modules
    BomModule,
    AuthModule,
    UserModule,
    ApplicationModule,
    MailModule,
    OtpModule,
    ProfileModule,
    QuoteModule,
    HealthModule,
    EMSModule,
    CompanyModule,
    ProjectsModule,
    IngestionModule,
    ProjectModule,
    PurchaseOrderModule,
    ReviewsModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [
    PrismaService,
    { provide: APP_GUARD, useClass: AccessTokenGuard },
    PurchaseOrderService,
    PurchaseOrderResolver,
  ],
})
export class AppModule {}
