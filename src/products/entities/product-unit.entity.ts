import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Product } from './product.entity';
import { Unit } from '../../units/entities/unit.entity';

@Entity('product_units')
export class ProductUnit {
  @PrimaryGeneratedColumn()
  id: number;

  // 1. ربط مع جدول الأصناف
  @ManyToOne(() => Product, (product) => product.productUnits)
  product: Product;

  // 2. ربط مع جدول الوحدات
  @ManyToOne(() => Unit)
  unit: Unit;

  // 3. معامل التحويل (الرقم السحري: مثلاً 50)
  @Column('decimal', { precision: 10, scale: 2 })
  conversionFactor: number; 

  // 4. الباركود (مهم جداً للمطاعم: الشوال له باركود يختلف عن الكيلو)
  @Column({ nullable: true })
  barcode: string; 
}