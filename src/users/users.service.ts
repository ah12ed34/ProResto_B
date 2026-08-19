import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import * as bcrypt from 'bcrypt'; // 1. استدعاء مكتبة التشفير
import { CreateRoleDto } from './dto/create-role.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { Branch } from './../branches/entities/branch.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    @InjectRepository(Role) private roleRepo: Repository<Role>,
    @InjectRepository(Branch) private branchRepo: Repository<Branch>,
  ) {}

  createRole(data: CreateRoleDto) {
    const { name, permissions } = data;
    if (!name || !permissions || !Array.isArray(permissions)) {
      throw new NotFoundException('اسم الدور والصلاحيات مطلوبة ويجب أن تكون مصفوفة');
    }
    const existingRole = this.roleRepo.findOne({ where: { name } });
    if (existingRole !== null) {
      throw new NotFoundException('الدور موجود بالفعل');
    }
    const newRole = this.roleRepo.create(data);
    return this.roleRepo.save(newRole);
  }
  getRoles() {
    return this.roleRepo.find();
  }
    // =========================
  // GET ALL
  // =========================

  async findAll() {
    return this.userRepo.find({
      relations: ['role', 'branch'],
      order: {
        id: 'DESC',
      },
    });
  }

  // =========================
  // GET ONE
  // =========================

  async findOne(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
      relations: ['role', 'branch'],
    });

    if (!user) {
      throw new NotFoundException('المستخدم غير موجود');
    }

    return user;
  }

  // =========================
  // CREATE
  // =========================

  async createUser(data: CreateUserDto) {
    const existingUser = await this.userRepo.findOne({
      where: {
        username: data.username,
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'اسم المستخدم مستخدم بالفعل',
      );
    }

    const role = await this.roleRepo.findOne({
      where: { id: Number(data.roleId) },   // ✅ convert to number
    });


    if (!role) {
      throw new NotFoundException('الدور غير موجود');
    }

    const branch = await this.branchRepo.findOne(
      {
        where: {
          id: Number(data.branchId),
        },
      }
    );

    if (!branch) {
      throw new NotFoundException('الفرع غير موجود');
    }

    const hashedPassword = await bcrypt.hash(
      data.password,
      10,
    );

    const user = this.userRepo.create({
      name: data.name,
      username: data.username,
      password: hashedPassword,
      email: data.email,
      phone: data.phone,
      image: data.image,
      role,
      branch,
    });

    const savedUser = await this.userRepo.save(user);

    return this.findOne(savedUser.id);
  }

  // =========================
  // UPDATE
  // =========================

  async updateUser(
    id: number,
    data: UpdateUserDto,
  ) {
    const user = await this.userRepo.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(
        'المستخدم غير موجود',
      );
    }

    if (
      data.username &&
      data.username !== user.username
    ) {
      const existingUser = await this.userRepo.findOne({
        where: {
          username: data.username,
        },
      });

      if (
        existingUser &&
        existingUser.id !== user.id
      ) {
        throw new ConflictException(
          'اسم المستخدم مستخدم بالفعل',
        );
      }

      user.username = data.username;
    }

    if (data.name !== undefined) {
      user.name = data.name;
    }

    if (data.email !== undefined) {
      user.email = data.email;
    }

    if (data.phone !== undefined) {
      user.phone = data.phone;
    }

    if (data.image !== undefined) {
      user.image = data.image;
    }

    if (data.roleId !== undefined) {
      const role = await this.roleRepo.findOne({
        where: {
          id: data.roleId,
        },
      });

      if (!role) {
        throw new NotFoundException(
          'الدور غير موجود',
        );
      }

      user.role = role;
    }

    if (data.branchId !== undefined) {
      const branch = await this.branchRepo.findOne({
        where: {
          id: data.branchId,
        },
      });

      if (!branch) {
        throw new NotFoundException(
          'الفرع غير موجود',
        );
      }

      user.branch = branch;
    }

    await this.userRepo.save(user);

    return this.findOne(id);
  }

  // =========================
  // PASSWORD
  // =========================

  async resetPassword(
    userId: number,
    newPassword: string,
  ) {
    const user = await this.userRepo.findOne({
      where: {
        id: userId,
      },
    });

    if (!user) {
      throw new NotFoundException(
        'المستخدم غير موجود',
      );
    }

    user.password = await bcrypt.hash(
      newPassword,
      10,
    );

    await this.userRepo.save(user);

    return {
      message: 'تم تغيير كلمة المرور بنجاح',
    };
  }

  // =========================
  // DELETE
  // =========================

  async remove(id: number) {
    const user = await this.userRepo.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException(
        'المستخدم غير موجود',
      );
    }

    await this.userRepo.remove(user);

    return {
      message: 'تم حذف المستخدم بنجاح',
    };
  }
}