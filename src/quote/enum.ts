import { registerEnumType } from '@nestjs/graphql';

export enum QuoteMaterials {
  PCB = 'PCB',
  COMPONENT = 'COMPONENT',
  STENCIL = 'STENCIL',
}

registerEnumType(QuoteMaterials, {
  name: 'QuoteMaterials',
});
