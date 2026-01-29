import { Resolver, Query, Args, Int, Mutation } from '@nestjs/graphql';
import { ProjectService } from './project.service';
import { ProjectDTO } from './entities/project.entity';
import { AuthUser } from 'src/auth/decorators/auth-user.decorator';
import { ForbiddenException } from '@nestjs/common';
import { UpdateProjectStatusInput } from './dto/update-project-status.input';
import { ProjectStatusHistory } from './entities/project-status-history.entity';

@Resolver(() => ProjectDTO)
export class ProjectResolver {
  constructor(private readonly projectService: ProjectService) {}

  // ✅ EMS Project List API
  @Query(() => [ProjectDTO])
  async emsProjects(
    @AuthUser() user: { userId: number; role: string },
  ) {
    if (user.role !== 'EMS') {
      throw new ForbiddenException('Only EMS can access projects');
    }

    return this.projectService.getProjectsForEMS(user.userId);
  }


  @Query(() => ProjectDTO)
async projectDetail(
  @AuthUser() user: { userId: number },
  @Args('projectId', { type: () => Int }) projectId: number,
) {
  return this.projectService.getProjectDetail(projectId, user.userId);
}


@Mutation(() => ProjectDTO)
async updateProjectStatus(
  @AuthUser() user: { userId: number },
  @Args('projectId', { type: () => Int }) projectId: number,
  @Args('input') input: UpdateProjectStatusInput,
) {
  return this.projectService.updateProjectStatus(
    projectId,
    user.userId,
    input.status,
    input.note,
  );
}


@Query(() => [ProjectStatusHistory])
async projectTimeline(
  @AuthUser() user: { userId: number },
  @Args('projectId', { type: () => Int }) projectId: number,
) {
  return this.projectService.getProjectTimeline(projectId, user.userId);
}



}
