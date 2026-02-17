import { Module } from '@nestjs/common';
import { ProjectService } from './project.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ProjectResolver } from './project.resolver';

@Module({
  imports: [PrismaModule],
  providers: [ProjectService, ProjectResolver],
  exports: [ProjectService],
})
export class ProjectModule { }
