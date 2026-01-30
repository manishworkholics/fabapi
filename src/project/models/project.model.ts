import { ObjectType, Field, Int } from '@nestjs/graphql';
import { Quote } from '../../quote/entities/quote.entity';
import { User } from '../../user/user.entity';
import { ProjectStatusHistoryDTO } from '../../projects/dto/project-status-history.dto';
import { PurchaseOrderDTO } from '../../purchase-order/dto/purchase-order.dto';

@ObjectType()
export class ProjectDTO {
  @Field(() => Int)
  id: number;

  @Field()
  status: string;

  @Field()
  createdAt: Date;

  @Field(() => Quote)
  quote: Quote;

  

  @Field(() => User)
  ems: User;

  @Field(() => User)
  pm: User;

  @Field(() => [ProjectStatusHistoryDTO])
  history: ProjectStatusHistoryDTO[];

  @Field(() => PurchaseOrderDTO, { nullable: true })
  purchaseOrder?: PurchaseOrderDTO;
}
