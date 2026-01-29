import { ObjectType, Field, Int } from '@nestjs/graphql';
import { ProjectStatus } from '../enums/project-status.enum';

@ObjectType()
export class ProjectStatusHistory {
  @Field(() => Int)
  id: number;

  @Field(() => Int)
  projectId: number;

  @Field(() => ProjectStatus)
  status: ProjectStatus;

  @Field(() => String, { nullable: true })
  note?: string;

  @Field(() => Date)
  createdAt: Date;
}
