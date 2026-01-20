import {
  Field,
  ObjectType,
  GraphQLISODateTime,
  registerEnumType,
  Int,
} from '@nestjs/graphql';
import { User } from '../user/user.entity';

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
}

export enum ProfileJobRole {
  DESIGN_ENGINEER = 'DESIGN_ENGINEER',
  PURCHASING_ENGINEER = 'PURCHASING_ENGINEER',
  CONTRACT_MANUFACTURER = 'CONTRACT_MANUFACTURER',
  ELECTRONIC_MANUFACTURING_SERVICE = 'ELECTRONIC_MANUFACTURING_SERVICE',
}

export enum ProjectBuildType {
  PCB = 'PCB',
}

export enum EMSAvailabilityStatus {
  ACTIVE = 'ACTIVE',
  OPEN = 'OPEN',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
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
