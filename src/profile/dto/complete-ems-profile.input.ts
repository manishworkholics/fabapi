import { InputType, Field, Int } from '@nestjs/graphql';
import { ProfileJobRole } from '../../common/enums/profile-job-role.enum';
import { ProjectBuildType } from '../../common/enums/project-build-type.enum';
import { EMSAvailabilityStatus } from '../../common/enums/ems-availability-status.enum';

@InputType()
export class CompleteEMSProfileInput {
  @Field()
  phone: string;

  @Field()
  location: string;

  @Field(() => ProfileJobRole)
  jobRole: ProfileJobRole;

  @Field(() => ProjectBuildType)
  projectBuildType: ProjectBuildType;

  @Field(() => EMSAvailabilityStatus)
  availabilityStatus: EMSAvailabilityStatus;

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
