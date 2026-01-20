import { registerEnumType } from '@nestjs/graphql';
import { ProfileJobRole, ProjectBuildType, EMSAvailabilityStatus } from '@prisma/client';

registerEnumType(ProfileJobRole, {
  name: 'ProfileJobRole',
});

registerEnumType(ProjectBuildType, {
  name: 'ProjectBuildType',
});

registerEnumType(EMSAvailabilityStatus, {
  name: 'EMSAvailabilityStatus',
});