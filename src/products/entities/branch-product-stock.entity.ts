import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';

import { Product } from './product.entity';
import { Branch } from '../../branches/entities/branch.entity';

@Entity('branch_product_stocks')
@Index(['branch', 'product'], { unique: true })
export class BranchProductStock {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Branch, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  branch: Branch;

  @ManyToOne(() => Product, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  product: Product;

  @Column('decimal', {
    precision: 10,
    scale: 2,
    default: 0,
  })
  qty: number;
}