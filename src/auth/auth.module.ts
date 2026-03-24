import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { StringValue } from 'ms';

@Module({
  imports: [
     ConfigModule.forRoot({
          isGlobal: true,
        }),
    // لنتمكن من البحث في جدول المستخدمين

    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        global: true,
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn:
            configService.get<StringValue>('JWT_EXPIRES_IN') ?? '12h',
        },
      }),
    }), UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [JwtModule], // لتصدير مكتبة إصدار التذاكر لباقي الأقسام
})
export class AuthModule {}