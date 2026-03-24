import { Injectable } from '@nestjs/common';
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
}