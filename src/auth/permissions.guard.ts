import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt'; // 1. استدعاء مكتبة فك التشفير
import { User } from '../users/entities/user.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @InjectRepository(User) private userRepo: Repository<User>,
    private jwtService: JwtService, // 2. حقن خدمة التذاكر هنا
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.get<string[]>('permissions', context.getHandler());
    if (!requiredPermissions) return true; 

    const request = context.switchToHttp().getRequest();
    
    // 🌟 3. قراءة التذكرة من الهيدر الرسمي (Authorization) بدلاً من user-id
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('ممنوع الدخول! يرجى تسجيل الدخول أولاً (Token مفقود).');
    }

    // فصل كلمة Bearer عن التذكرة نفسها
    const token = authHeader.split(' ')[1];
    let payload;

    try {
      // 🌟 4. التأكد من صحة التذكرة وفك تشفيرها
      payload = await this.jwtService.verifyAsync(token);
    } catch (error) {
      throw new UnauthorizedException('عذراً، التذكرة غير صالحة أو منتهية الصلاحية! يرجى تسجيل الدخول مجدداً.');
    }

    // التذكرة سليمة! الآن نأخذ رقم الموظف منها
    const userId = payload.sub;

    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['role'],
    });

    if (!user || !user.role) {
      throw new ForbiddenException('عذراً، حسابك غير مرتبط بصلاحيات واضحة!');
    }

    const hasPermission = requiredPermissions.every(permission =>
      user.role.permissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('عذراً، ليس لديك الصلاحية لتنفيذ هذه العملية!');
    }

    request.user = user; 
    
    return true; 
  }
}