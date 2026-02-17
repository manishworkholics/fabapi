import { Field, Int, ObjectType } from '@nestjs/graphql';
import { AdminProject } from './admin-project.type';

@ObjectType()
export class AdminProjectListResponse {
  @Field(() => [AdminProject])
  projects: AdminProject[];

  @Field(() => Int)
  total: number;
}
