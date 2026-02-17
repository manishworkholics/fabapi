import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UserService } from './user.service';
import { User } from './user.entity';
import { Public } from '../auth/decorators/public.decorator';
import { BasicResponse } from '../app/dto/basic-response';
import { AuthUser } from '../auth/decorators/auth-user.decorator';
import { UpdateMeInput } from './dto/update-me.input';
import { UserResponse } from './dto/user-response';

@Resolver(() => User)
export class UserResolver {
  constructor(private readonly userService: UserService) {}

  @Public()
  @Query(() => [User], { name: 'users' })
  users() {
    return this.userService.findAll();
  }

  @Query(() => User)
  user(@Args('id', { type: () => Int }) id: number) {
    return this.userService.find(id);
  }

  @Query(() => User)
  async me(@AuthUser() user: User) {
    return await this.userService.findByEmail(user.email);
  }

  @Mutation(() => BasicResponse)
  async verifyEmail(@Args('token', { type: () => String }) token: string) {
    let message = `Email Could Not Be Verified!`;

    const status = await this.userService.markVerified(token);

    if (status) {
      message = `Email Verification Successful!`;
    }

    return {
      status: status ? 'success' : 'failed',
      message: message,
    };
  }

  @Mutation(() => BasicResponse)
  async requestEmailVerification(@AuthUser() user: User) {
    let message = `Email Not Sent!`;

    //todo update this to be a queued task
    const status = await this.userService.requestVerificationMail(user.email);

    if (status) {
      message = `Email Sent Successfully!`;
    }

    return {
      status: status ? 'success' : 'failed',
      message,
    };
  }

  @Mutation(() => UserResponse)
  async updateMe(@AuthUser() user: User, @Args('input') input: UpdateMeInput) {
    const updatedUser = await this.userService.updateMe(user.email, input);
    return {
      status: 'success',
      message: 'updated successfully',
      user: updatedUser,
    };
  }
}
