import { registerEnumType } from '@nestjs/graphql';

export enum EMSAvailabilityStatus {
  ACTIVE = 'ACTIVE',
  OPEN = 'OPEN',
  NOT_AVAILABLE = 'NOT_AVAILABLE',
}

registerEnumType(EMSAvailabilityStatus, {
  name: 'EMSAvailabilityStatus',
});
