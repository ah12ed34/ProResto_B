import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'ممنوع الدخول! يرجى تسجيل الدخول أولاً.',
      );
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('الرمز غير موجود.');
    }

    let payload: any;

    try {
      payload = await this.jwtService.verifyAsync(token);
    } catch (error) {
      throw new UnauthorizedException(
        'التوكن غير صالح أو منتهي الصلاحية.',
      );
    }

    const user = await this.userRepo.findOne({
      where: { id: payload.sub },
      relations: ['role', 'branch'], // تأكد من جلب العلاقة مع الدور والفرع
    });

    if (!user) {
      throw new UnauthorizedException('المستخدم غير موجود.');
    }

    request.user = user;

    return true;
  }
}