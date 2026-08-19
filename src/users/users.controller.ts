import { Controller, Post, Body, UseGuards ,Patch,Param , Get } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { RequirePermissions } from 'src/auth/permissions.decorator';
import { PERMISSIONS } from 'src/auth/permissions';
import { CreateRoleDto } from './dto/create-role.dto';
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // الرابط: POST /users/roles
  @Post('roles')
  @RequirePermissions(PERMISSIONS.MANAGE_ROLES)
  createRole(@Body() body: CreateRoleDto) {
    if (!body.name || !body.permissions) {
      return { error: 'Role name and permissions are required' };
    }
    return this.usersService.createRole(body);
  }

  @Get('roles')
  @RequirePermissions(PERMISSIONS.MANAGE_ROLES)
  getRoles() {
    return this.usersService.getRoles();
  }

  // الرابط: POST /users
  @Post()
  @RequirePermissions(PERMISSIONS.MANAGE_USERS)
  createUser(@Body() body: any) {
    if (!body.name || !body.username || !body.password || !body.roleId) {
        return { error: 'Name, username, password, and roleId are required' };
    }
    // if (typeof body.password !== 'string' || body.password.length < 6) {
    //     return { error: 'Password must be a string with at least 6 characters' };
    // }
    return this.usersService.createUser(body);
  }

  @Get()
  @RequirePermissions(PERMISSIONS.MANAGE_USERS)
  getUsers() {
    return this.usersService.findAll();
  }

  // الرابط: POST /users/reset-password
  @Patch(':id/password')
resetPassword(
  @Param('id') id: string,
  @Body() body: { password: string },
) {
  return this.usersService.resetPassword(+id, body.password);
}
}