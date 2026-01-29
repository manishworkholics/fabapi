import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class ProjectStatusHistoryDTO {
  @Field(() => Int)
  id: number;

  @Field(() => String)
  status: string;

  @Field({ nullable: true })
  note?: string;

  @Field()
  createdAt: Date;
}
