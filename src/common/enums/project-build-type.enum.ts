import { registerEnumType } from '@nestjs/graphql';

export enum ProjectBuildType {
  PCB = 'PCB',
}

registerEnumType(ProjectBuildType, {
  name: 'ProjectBuildType',
});
