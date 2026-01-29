import { registerEnumType } from '@nestjs/graphql';

export enum ProjectStatus {
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  MANUFACTURING = 'MANUFACTURING',
  ON_HOLD = 'ON_HOLD',
  COMPLETED = 'COMPLETED',
}

registerEnumType(ProjectStatus, {
  name: 'ProjectStatus',
});
