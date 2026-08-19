import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Unit } from './entities/unit.entity';

@Injectable()
export class UnitsService {
  constructor(
    @InjectRepository(Unit)
    private unitsRepository: Repository<Unit>,
  ) {}

  create(unitData: any) {
    const newUnit = this.unitsRepository.create(unitData);
    return this.unitsRepository.save(newUnit);
  }

  findAll() {
    return this.unitsRepository.find();
  }

  async updateUnit(id: number, updateData: any) {
    const unit = await this.unitsRepository.findOne({ where: { id } });
    if (!unit) throw new NotFoundException(`الصنف غير موجود`);
    
    Object.assign(unit, updateData);
    return await this.unitsRepository.save(unit);
  }

  async removeUnit(id: number) {
    const unit = await this.unitsRepository.findOne({ where: { id } });
    if (!unit) throw new NotFoundException(`الصنف غير موجود`);
    
    // ملاحظة: إذا كان الصنف مرتبطاً بفواتير سابقة، يُفضل عمل Soft Delete (إخفاء) بدلاً من الحذف النهائي
    return await this.unitsRepository.remove(unit);
  }
}