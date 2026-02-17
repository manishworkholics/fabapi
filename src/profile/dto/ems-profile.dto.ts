import { ObjectType, Field, Int, Float } from '@nestjs/graphql';
import { EMSAvailabilityStatus } from '../../common/enums/ems-availability-status.enum';
import { ProfileJobRole } from '../../common/enums/profile-job-role.enum';
import { ProjectBuildType } from '../../common/enums/project-build-type.enum';

@ObjectType()
export class EMSProfileDTO {
  @Field(() => Int)
  id: number;

  @Field({ nullable: true })
  companyName?: string;

  @Field({ nullable: true })
  location?: string;

  @Field({ nullable: true })
  bio?: string;

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

  @Field(() => ProfileJobRole, { nullable: true })
  jobRole?: ProfileJobRole;

  @Field(() => ProjectBuildType, { nullable: true })
  projectBuildType?: ProjectBuildType;

  @Field(() => EMSAvailabilityStatus, { nullable: true })
  EMSAvailabilityStatus?: EMSAvailabilityStatus;

  // ⭐⭐⭐ ADD THESE TWO ONLY ⭐⭐⭐

  @Field(() => Float, { nullable: true })
  rating?: number;

  @Field(() => Int, { nullable: true })
  reviewCount?: number;
}
