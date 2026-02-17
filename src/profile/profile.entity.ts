import {
  Field,
  ObjectType,
  GraphQLISODateTime,
  registerEnumType,
  Int,
} from '@nestjs/graphql';
import { User } from '../user/user.entity';
import { ProfileJobRole } from '../common/enums/profile-job-role.enum';
import { ProjectBuildType } from '../common/enums/project-build-type.enum';
import { EMSAvailabilityStatus } from '../common/enums/ems-availability-status.enum';


@ObjectType()
export class Profile {
  @Field(() => Int)
  id: number;

  @Field({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  location?: string;

  @Field((type) => User)
  user: User;

  @Field((type) => ProfileJobRole, { nullable: true })
  jobRole?: ProfileJobRole;

  @Field((type) => ProjectBuildType, { nullable: true })
  projectBuildType?: ProjectBuildType;

  @Field(() => EMSAvailabilityStatus, { nullable: true })
  EMSAvailabilityStatus?: EMSAvailabilityStatus;

  @Field(() => GraphQLISODateTime)
  createdAt: string;

  @Field(() => GraphQLISODateTime)
  updatedAt: string;

  @Field({ nullable: true })
  companyName?: string;

  @Field({ nullable: true })
  establishedYear?: number;

  @Field({ nullable: true })
  employeeRange?: string;

  @Field(() => [String], { nullable: true })
  certifications?: string[];

  @Field(() => [String], { nullable: true })
  specialties?: string[];

  @Field(() => [String], { nullable: true })
  manufacturingCapabilities?: string[];

  @Field(() => [String], { nullable: true })
  equipmentList?: string[];

  @Field({ nullable: true })
  facilityVideoUrl?: string;

  @Field({ nullable: true })
  projectsCompleted?: number;

}






registerEnumType(ProfileJobRole, {
  name: 'ProfileJobRole',
  description: 'Profile Job Roles',
});

registerEnumType(ProjectBuildType, {
  name: 'ProjectBuildType',
  description: 'Project Build Type',
});

registerEnumType(EMSAvailabilityStatus, {
  name: 'EMSAvailabilityStatus',
  description: 'EMS Availability Status',
});
