import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Role } from './role.entity'; // استدعاء جدول الأدوار الجديد
import { Exclude } from 'class-transformer';
import { Branch } from './../../branches/entities/branch.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string; // الاسم الحقيقي (مثال: أحمد الجوفي)

  @Column({ unique: true })
  username: string; // اسم الدخول

  @Column()
  @Exclude()
  password: string; // كلمة المرور

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  image?: string;

  @Column({ nullable: true })
  @Exclude()
  refreshToken?: string; // 

  // 🌟 التعديل السحري: ربط المستخدم بجدول الأدوار بدلاً من النص الثابت
  @ManyToOne(() => Role, (role) => role.users)
  role: Role;

  @ManyToOne(() => Branch, (branch) => branch.users)
  branch: Branch;
  
}