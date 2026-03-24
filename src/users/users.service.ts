import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import * as bcrypt from 'bcrypt'; // 1. استدعاء مكتبة التشفير

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
  ) {}

  createRole(data: any) {
    const newRole = this.roleRepo.create(data);
    return this.roleRepo.save(newRole);
  }

  async createUser(data: any) {
    const role = await this.roleRepo.findOne({ where: { id: data.roleId } });
    if (!role) throw new NotFoundException(`الدور غير موجود!`);

    // 2. تشفير كلمة المرور (رقم 10 هو قوة التشفير)
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const newUser = this.userRepo.create({
      name: data.name,
      username: data.username,
      password: hashedPassword, // 3. حفظ الباسوورد المشفر بدلاً من العادي
      role: role,
    });

    return this.userRepo.save(newUser);
  }
}