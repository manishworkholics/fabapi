import { Args, Query, Resolver } from '@nestjs/graphql';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrder } from './entities/purchase-order.entity';
import { PurchaseOrderDTO } from './dto/purchase-order.dto';
import { AuthUser } from 'src/auth/decorators/auth-user.decorator';


@Resolver()
export class PurchaseOrderResolver {
  purchaseOrderService: any;
  constructor(private poService: PurchaseOrderService) { }

  @Query(() => PurchaseOrder)
  getPurchaseOrder(
    @Args('projectId') projectId: string,
  ) {
    return this.poService.getByProject(projectId);
  }

  @Query(() => PurchaseOrderDTO, { nullable: true })
  getPurchaseOrderByQuote(
    @AuthUser() user: { userId: number },
    @Args('quoteId') quoteId: string,
  ) {
    return this.purchaseOrderService.getPurchaseOrderByQuoteId(quoteId);
  }


}

