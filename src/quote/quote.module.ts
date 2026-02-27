import { Module } from '@nestjs/common';
import { QuoteService } from './quote.service';
import { QuoteResolver } from './quote.resolver';
import { PrismaService } from 'src/prisma/prisma.service';
import { ProjectModule } from '../project/project.module';
import { PurchaseOrderModule } from '../purchase-order/purchase-order.module';
import { MailModule } from 'src/mail/mail.module';


@Module({
  providers: [QuoteResolver, QuoteService, PrismaService],
  exports: [QuoteService], // Export QuoteService so it can be used in other modules
  imports: [ProjectModule, PurchaseOrderModule,MailModule],
})
export class QuoteModule { }
