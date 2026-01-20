import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Observable } from 'rxjs';

@Injectable()
export class AccessTokenGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Pulls the request object out of either:
   *  - GraphQL context, or
   *  - HTTP context (REST/WebSocket)
   */
  getRequest(context: ExecutionContext) {
    // Always get the HTTP request first
    const httpRequest = context.switchToHttp().getRequest();
    // Then try GraphQL — will throw if this isn't a GraphQL execution
    try {
      const gqlCtx = GqlExecutionContext.create(context);
      return gqlCtx.getContext().req;
    } catch {
      return httpRequest;
    }
  }

  /**
   * Preserve  @Public() logic from Reflector,
   * then defer to Passport's `canActivate()` for JWT.
   */
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    // Passport AuthGuard will use our overridden getRequest()
    return super.canActivate(context);
  }
}
