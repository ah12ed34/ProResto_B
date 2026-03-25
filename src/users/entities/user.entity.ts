import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Role } from './role.entity'; // استدعاء جدول الأدوار الجديد
import { Exclude } from 'class-transformer';

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

  // 🌟 التعديل السحري: ربط المستخدم بجدول الأدوار بدلاً من النص الثابت
  @ManyToOne(() => Role, (role) => role.users)
  role: Role;
}