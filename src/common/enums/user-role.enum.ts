import { registerEnumType } from '@nestjs/graphql';

export enum UserRole {
  EMS = 'EMS',
  PM = 'PM',
  TALENT_MANAGER = 'TALENT_MANAGER',
  TALENTS = 'TALENTS',
}

registerEnumType(UserRole, {
  name: 'UserRole',
});
