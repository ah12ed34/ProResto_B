import { Module } from '@nestjs/common';
import { UnitsService } from './units.service';
import { UnitsController } from './units.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Unit } from './entities/unit.entity';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';
@Module({
  imports: [TypeOrmModule.forFeature([Unit]),UsersModule,AuthModule],
  controllers: [UnitsController],
  providers: [UnitsService],
  exports: [TypeOrmModule],
})
export class UnitsModule {}
