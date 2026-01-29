import { Args, Query, Resolver } from '@nestjs/graphql';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrder } from './entities/purchase-order.entity';


@Resolver()
export class PurchaseOrderResolver {
  constructor(private poService: PurchaseOrderService) {}

  @Query(() => PurchaseOrder)
  getPurchaseOrder(
    @Args('projectId') projectId: string,
  ) {
    return this.poService.getByProject(projectId);
  }
}

