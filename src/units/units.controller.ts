import { Controller, Get, Post, Body } from '@nestjs/common';
import { UnitsService } from './units.service';

@Controller('units')
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post()
  create(@Body() body: any) {
    return this.unitsService.create(body);
  }

  @Get()
  findAll() {
    return this.unitsService.findAll();
  }
}