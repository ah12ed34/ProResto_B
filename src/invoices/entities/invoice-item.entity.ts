import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Invoice } from './invoice.entity';
import { Product } from '../../products/entities/product.entity';
import { Unit } from '../../units/entities/unit.entity'; // استدعاء جدول الوحدات
import { ProductUnit } from 'src/products/entities/product-unit.entity';

@Entity('invoice_items')
export class InvoiceItem {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Invoice, (invoice) => invoice.items)
  invoice: Invoice;

  @ManyToOne(() => Product)
  product: Product;

  // 🌟 التعديل الجديد: ما هي الوحدة التي تم استخدامها في هذه الفاتورة؟ (شوال أم كيلو؟)
  @ManyToOne(() => Unit)
  unit: Unit;

  @ManyToOne(() => ProductUnit)
  productUnit: ProductUnit;

  // حولناها إلى decimal لتقبل بيع نصف كيلو مثلاً
  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number; 

  @Column('decimal', { precision: 10, scale: 2 })
  unitPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  totalPrice: number;
}