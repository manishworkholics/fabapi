import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { ProjectService } from './project.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Project } from './models/project.model';

@Resolver()
export class ProjectResolver {
  constructor(private readonly projectService: ProjectService) {}

  @Query(() => [Project])
  myProjectsAsPM(@CurrentUser() user: any) {
    return this.projectService.getProjectsForPM(user.id);
  }

  @Query(() => [Project])
  myProjectsAsEMS(@CurrentUser() user: any) {
    return this.projectService.getProjectsForEMS(user.id);
  }

  @Mutation(() => Boolean)
  async updateProjectStatus(
    @Args('projectId') projectId: number,
    @Args('status') status: string,
    @Args('note', { nullable: true }) note?: string,
  ) {
    await this.projectService.updateProjectStatus(projectId, status as any, note);
    return true;
  }
}
