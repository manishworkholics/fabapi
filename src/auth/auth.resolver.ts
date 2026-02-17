import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { AuthService } from './auth.service';
import { LoginInput } from './dto/login-in.input';
import { RegisterInput } from './dto/register.input';
import { AuthResponse } from './dto/auth-response';
import { BasicResponse } from '../app/dto/basic-response';
import { Public } from './decorators/public.decorator';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
import { JwtUser } from 'src/common/types/jwt-user.type'; 

@Resolver(() => AuthResponse)
export class AuthResolver {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Mutation(() => AuthResponse)
  register(@Args('input') registerInput: RegisterInput) {
    return this.authService.registerUser(registerInput);
  }

  @Public()
  @Mutation(() => AuthResponse)
  login(@Args('input') loginInput: LoginInput) {
    return this.authService.loginUser(loginInput);
  }

   // ⭐ CHANGE PASSWORD
  @Mutation(() => Boolean)
  changePassword(
    @CurrentUser() user: JwtUser,
    @Args('oldPassword') oldPassword: string,
    @Args('newPassword') newPassword: string,
  ) {
    return this.authService.changePassword(
      user.userId,
      oldPassword,
      newPassword,
    );
  }


  @Mutation(() => BasicResponse)
  logout() {
    //@todo
    // invalidate token here
    // implement trackable/manageable token system with jwt
    return {
      status: 'success',
      message: `Logout Successful!`,
    };
  }
}
