import { Controller, Post, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // الرابط: POST /users/roles
  @Post('roles')
  createRole(@Body() body: any) {
    if (!body.name || !body.permissions) {
      return { error: 'Role name and permissions are required' };
    }
    return this.usersService.createRole(body);
  }

  // الرابط: POST /users
  @Post()
  createUser(@Body() body: any) {
    if (!body.name || !body.username || !body.password || !body.roleId) {
        return { error: 'Name, username, password, and roleId are required' };
    }
    // if (typeof body.password !== 'string' || body.password.length < 6) {
    //     return { error: 'Password must be a string with at least 6 characters' };
    // }
    return this.usersService.createUser(body);
  }
}