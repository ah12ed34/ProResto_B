import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, ManyToOne, DeleteDateColumn } from 'typeorm';
import { InvoiceItem } from './invoice-item.entity';
import { User } from '../../users/entities/user.entity'; // 1. استدعاء جدول المستخدمين
import { Branch } from 'src/branches/entities/branch.entity';

// تحديد أنواع الفواتير
export enum InvoiceType {
  SALE = 'sale',         // فاتورة مبيعات للزبون
  PURCHASE = 'purchase', // فاتورة مشتريات من المورد
  ISSUE = 'issue',       // 🌟 فاتورة جديدة: سند صرف داخلي للمطبخ
}
@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn()
  id: number;

  // 🌟 التعديل 1: تحديد نوع الفاتورة
  @Column({ type: 'enum', enum: InvoiceType })
  type: InvoiceType;

  // تم تغيير الاسم ليكون عاماً (اسم المورد في المشتريات، أو اسم الزبون/الطاولة في المبيعات)
  @Column({ nullable: true })
  partyName: string; 

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  totalAmount: number;

  @CreateDateColumn()
  createdAt: Date;

  // 🌟 التعديل 2: من الذي أصدر الفاتورة؟ (إجباري)
  @ManyToOne(() => User)
  createdBy: User;

  // 🌟 التعديل 3: من استلم الطلب في المطبخ؟ (اختياري - nullable: true)
  @ManyToOne(() => User, { nullable: true })
  kitchenReceiver: User;

  @OneToMany(() => InvoiceItem, (item) => item.invoice, { cascade: true })
  items: InvoiceItem[];

  @ManyToOne(() => User, { nullable: true })
  updatedBy?: User;

  @CreateDateColumn()
  updatedAt?: Date;

  @ManyToOne(() => Branch)
  branch: Branch; // ربط الفاتورة بفرع معين (اختياري)
}