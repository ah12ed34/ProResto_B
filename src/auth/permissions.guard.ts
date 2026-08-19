import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.get<string[]>(
      'permissions',
      context.getHandler(),
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('لا توجد بيانات مستخدم أو صلاحيات.');
    }

    const hasPermission = requiredPermissions.every((permission) =>
      user.role.permissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        'عذراً، ليس لديك الصلاحية لتنفيذ هذه العملية!',
      );
    }

    return true;
  }
}