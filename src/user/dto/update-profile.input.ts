import { InputType, Field, Int, PartialType } from '@nestjs/graphql';
import { ProfileJobRole, ProjectBuildType } from '../../profile/profile.entity';

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
