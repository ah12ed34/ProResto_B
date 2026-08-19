import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Product } from './product.entity';
import { User } from '../../users/entities/user.entity';
import { Branch } from 'src/branches/entities/branch.entity';

export enum MovementType {
  IN = 'in',   // دخول (مشتريات، إضافة يدوية)
  OUT = 'out', // خروج (مبيعات، هالك)
}

@Entity('stock_movements')
export class StockMovement {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Product)
  product: Product;

  @Column({ type: 'enum', enum: MovementType })
  type: MovementType;

  @Column('decimal', { precision: 10, scale: 2 })
  quantity: number; // الكمية التي تحركت (مثلاً 10)

  @Column('decimal', { precision: 10, scale: 2 })
  balanceAfter: number; // الرصيد المتبقي بعد الحركة (للتدقيق لاحقاً)

  @Column()
  description: string; // البيان (مثال: "فاتورة مشتريات من شركة المراعي")

  @ManyToOne(() => User)
  user: User; // الموظف الذي قام بالعملية

  @CreateDateColumn()
  createdAt: Date; // تاريخ ووقت الحركة بالثانية

  
  @ManyToOne(() => Branch)
  branch: Branch; // ربط الحركة بفرع معين (اختياري)
}