import { Resolver, Mutation, Args, Query, Int } from '@nestjs/graphql';
import { ProfileService } from './profile.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CompleteProfileInput } from './dto/complete-profile.input';
import { EMSProfileDTO } from './dto/ems-profile.dto';

@Resolver()
export class ProfileResolver {
  constructor(private readonly profileService: ProfileService) { }

  // Existing mutation
  @Mutation(() => Boolean)
  async completeEMSProfile(
    @CurrentUser() user: { userId: number },
    @Args('input') input: CompleteProfileInput,
  ) {
    await this.profileService.completeEMSProfile(user.userId, input);
    return true;
  }

  // ✅ Get All EMS
  @Query(() => [EMSProfileDTO])
  getAllEMS() {
    return this.profileService.getAllEMS();
  }

  // ✅ Get EMS By ID
  @Query(() => EMSProfileDTO, { nullable: true })
  getEMSById(@Args('id', { type: () => Int }) id: number) {
    return this.profileService.getEMSById(id);
  }

  @Query(() => EMSProfileDTO, { nullable: true })
  getFullEMSDetailById(
    @Args('id', { type: () => Int }) id: number,
  ) {
    return this.profileService.getFullEMSDetailById(id);
  }

}
