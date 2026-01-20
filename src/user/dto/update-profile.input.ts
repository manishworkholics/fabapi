import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { ProjectBuildType } from '../../common/enums/project-build-type.enum';

import { ProfileJobRole } from '../../common/enums/profile-job-role.enum';

@InputType()
export class UpdateProfileInput {
  @Field(() => String, { nullable: true })
  bio?: string;

  @Field(() => String, { nullable: true })
  location?: string;

  @Field((type) => ProfileJobRole, { nullable: true })
  jobRole?: ProfileJobRole;

  @Field((type) => ProjectBuildType, { nullable: true })
  projectBuildType?: ProjectBuildType;
}
