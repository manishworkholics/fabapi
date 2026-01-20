import { registerEnumType } from '@nestjs/graphql';
import { ProfileJobRole } from '../enums/profile-job-role.enum';

registerEnumType(ProfileJobRole, {
  name: 'ProfileJobRole',
});
