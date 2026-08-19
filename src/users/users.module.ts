import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Branch } from 'src/branches/entities/branch.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Branch]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, TypeOrmModule], // 🌟 تصدير الخدمة والـ TypeOrmModule معاً
})
export class UsersModule {}