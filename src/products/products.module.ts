import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductUnit } from './entities/product-unit.entity';
import { UsersModule } from '../users/users.module'; // 1. استدعاء قسم المستخدمين
import { StockMovement } from './entities/stock-movement.entity'; // 2. استدعاء جدول حركات المخزون
import { AuthModule } from 'src/auth/auth.module';
import { Unit } from 'src/units/entities/unit.entity'; 
import { BranchProductStock } from './entities/branch-product-stock.entity'; // استدعاء جدول المخزون حسب الفرع

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductUnit, StockMovement ,Unit, BranchProductStock]), UsersModule,AuthModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [TypeOrmModule],
})
export class ProductsModule {}
