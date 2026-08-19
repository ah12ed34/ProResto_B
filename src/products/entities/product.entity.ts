import { Entity, Column, PrimaryGeneratedColumn, OneToMany, ManyToOne, DeleteDateColumn } from 'typeorm'; // أضفنا ManyToOne
import { ProductUnit } from './product-unit.entity';
import { Unit } from '../../units/entities/unit.entity'; // استدعاء جدول الوحدات
import { BranchProductStock } from './branch-product-stock.entity'; // استدعاء جدول مخزون الفروع
// 🌟 1. إضافة نوع الصنف
export enum ItemType {
  RAW = 'raw',   // مواد خام للمخزن (دقيق، لحم، زيت)
  MENU = 'menu', // أصناف قائمة للكاشير (برجر، بيتزا، شاي)
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  // 🌟 2. إضافة عمود النوع في الجدول
  @Column({ type: 'enum', enum: ItemType, default: ItemType.RAW })
  type: ItemType;

  // @Column('decimal', { precision: 10, scale: 2, default: 0 })
  // qty: number;

  // 🌟 التعديل الجديد: ربط الصنف بوحدة القياس الأساسية (الكيلو أو الحبة)
  @ManyToOne(() => Unit)
  baseUnit: Unit;

  @Column("int")
  minQty: number;

  @Column("int")
  maxQty: number;

  // العلاقة مع وحدات التعبئة (الشوال أو الكرتون) تبقى كما هي
  @OneToMany(() => ProductUnit, (productUnit) => productUnit.product, { cascade: true })
  productUnits: ProductUnit[];

  @OneToMany(() => BranchProductStock, (branchStock) => branchStock.product)
  branchStocks: BranchProductStock[];

  @DeleteDateColumn()
  deletedAt?: Date;
}