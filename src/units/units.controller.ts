import { Controller, Get, Post, Body, Patch , Delete ,Param , UseGuards} from '@nestjs/common';
import { UnitsService } from './units.service';
import { PermissionsGuard } from 'src/auth/permissions.guard';
import { RequirePermissions } from 'src/auth/permissions.decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
@Controller('units')
@UseGuards(JwtAuthGuard, PermissionsGuard)
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

  @Patch(':id')
  // @RequirePermissions('edit_unit')
  updateUnit(@Param('id') id: string, @Body() updateData: any) {
    return this.unitsService.updateUnit(+id, updateData);
  }

  @Delete(':id')
  // @RequirePermissions("delete_uint")
  removeUnit(@Param('id') id: string) {
    return this.unitsService.removeUnit(+id);
  }
}