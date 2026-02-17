import { InputType, Field } from '@nestjs/graphql';
import { ProjectStatus } from '../enums/project-status.enum';

@InputType()
export class UpdateProjectStatusInput {
  @Field(() => ProjectStatus)
  status: ProjectStatus;

  @Field({ nullable: true })
  note?: string;
}
