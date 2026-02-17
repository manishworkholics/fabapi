import { registerEnumType } from '@nestjs/graphql';

export enum UserRole {
  ADMIN = 'ADMIN',
  EMS = 'EMS',
  PM = 'PM',
  TALENT_MANAGER = 'TALENT_MANAGER',
  TALENTS = 'TALENTS',
}

registerEnumType(UserRole, {
  name: 'UserRole',
});
