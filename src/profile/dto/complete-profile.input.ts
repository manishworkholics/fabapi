import { InputType, Field, Int } from '@nestjs/graphql';
import { EMSAvailabilityStatus } from '../../common/enums/ems-availability-status.enum';
import { ProfileJobRole } from 'src/common/enums/profile-job-role.enum';
import { ProjectBuildType } from '../../common/enums/project-build-type.enum';

@InputType()
export class CompleteProfileInput {

  @Field({ nullable: true })
  phone?: string;

  @Field({ nullable: true })
  bio?: string;

  @Field({ nullable: true })
  location?: string;

  @Field(() => ProfileJobRole, { nullable: true })
  jobRole?: ProfileJobRole;

  @Field(() => ProjectBuildType, { nullable: true })
  projectBuildType?: ProjectBuildType;

  // keep this name as schema already uses it
  @Field(() => EMSAvailabilityStatus, { nullable: true })
  EMSAvailabilityStatus?: EMSAvailabilityStatus;

  // --------------------
  // ✅ NEW EMS FIELDS
  // --------------------

  @Field({ nullable: true })
  companyName?: string;

  @Field(() => Int, { nullable: true })
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
}
