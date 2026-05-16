import { SetMetadata, applyDecorators, UseGuards, createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Injectable, CanActivate } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../entities/user.entity';

// Roles metadata key
export const ROLES_KEY = 'roles';

// @Roles('admin', 'company')
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// Role guard checks the JWT role against allowed roles
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) {
      return true; // No roles specified = public
    }
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user.role);
  }
}

// Composite decorator for auth + roles
export const Auth = (...roles: UserRole[]) =>
  applyDecorators(
    UseGuards(AuthGuard('jwt'), RolesGuard),
    Roles(...roles),
  );

// Extract current user from request
export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
