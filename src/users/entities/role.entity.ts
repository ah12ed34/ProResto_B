import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { User } from './user.entity';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn()
  id: number;
    // not nullable and unique to prevent duplicate role names
  @Column({ unique: true, nullable: false })
  name: string; // اسم الدور (مثال: "مدير النظام"، "كاشير"، "محاسب")

  // 🌟 السر هنا: مصفوفة نصوص تحفظ الصلاحيات الدقيقة
  // TypeORM سيقوم بحفظها في قاعدة البيانات كنص مفصول بفواصل، ويقرأها كمصفوفة
  @Column('simple-array', { nullable: false })
  permissions: string[]; 
  // أمثلة للبيانات التي ستُحفظ هنا: ['create_sales', 'view_reports', 'add_products']

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}