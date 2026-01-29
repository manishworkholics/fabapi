import { Module } from '@nestjs/common';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrderResolver } from './purchase-order.resolver';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [PurchaseOrderService, PurchaseOrderResolver, PrismaService],
  exports: [PurchaseOrderService], // 👈 IMPORTANT for other modules
})
export class PurchaseOrderModule {}
