import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { InvoicesService } from './invoices.service'; // سننشئه الآن
import { InvoicesController } from './invoices.controller'; // سننشئه الآن
import { ProductsModule } from '../products/products.module'; // <-- استدعاء قسم المنتجات
import { UsersModule } from '../users/users.module'; // 1. استدعاء قسم المستخدمين
import { AuthModule } from 'src/auth/auth.module';
import { UnitConverterService } from './unit.converter.service';
@Module({
  imports: [
    TypeOrmModule.forFeature([Invoice, InvoiceItem]),
    ProductsModule, // <-- إضافته هنا
    UsersModule, // 2. إضافة قسم المستخدمين
    AuthModule
  ],
  providers: [InvoicesService, UnitConverterService],
  controllers: [InvoicesController]
})
export class InvoicesModule {}