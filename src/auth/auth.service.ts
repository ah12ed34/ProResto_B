import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService, // مكتبة إصدار التذاكر
  ) {}

  async login(username: string, pass: string) {
    // 1. البحث عن الموظف
    const user = await this.userRepo.findOne({ where: { username }, relations: ['role'] });
    if (!user) {
      throw new UnauthorizedException('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    // 2. مطابقة الباسوورد المدخل مع الباسوورد المشفر في الداتا بيز
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('اسم المستخدم أو كلمة المرور غير صحيحة');
    }

    // 3. صناعة التذكرة السحرية (Token)
    // نضع فيها رقم الموظف فقط (لا نضع الباسوورد أبداً!)
    const payload = { sub: user.id, username: user.username, name: user.name , role: user.role.name}; // يمكن إضافة بيانات أخرى حسب الحاجة
    
    return {
      token: await this.jwtService.signAsync(payload ),
       // بيانات سريعة لعرضها في التطبيق
    };
  }

    // دالة لفحص إذا كان الموظف يملك صلاحية معينة
    async isCanDo(userId: number, permission: string) {
        const user = await this.userRepo.findOne({ where: { id: userId }, relations: ['role'] });
        if (!user) {
            throw new UnauthorizedException('المستخدم غير موجود');
        }
        return user.role.permissions.includes(permission);
    }
}