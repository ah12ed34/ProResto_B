import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Branch } from './entities/branch.entity';
import { CreateBranchesDto } from './dto/create-branches.dto';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private readonly branchRepository: Repository<Branch>,
  ) {}

  async create(data: CreateBranchesDto) {
    const branch = this.branchRepository.create({
        name: data.name,
    });
    console.log('Creating branch:', branch); // Debugging line
    return this.branchRepository.save(branch);
  }
  
  async findAll() {
    return this.branchRepository.find({
      order: {
        id: 'ASC',
      },
    });
  }
}