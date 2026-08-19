import { IsNumber, IsString, IsOptional, Min, IsEnum } from 'class-validator';
import { ItemType } from '../entities/product.entity';
export class CreateProductDto  {

  @IsString()
  name: string;

  @IsNumber()
  baseUnit: number;

  @IsNumber()
  qty: number;

  @IsEnum({ enum: ItemType, message: 'نوع الصنف يجب أن يكون إما "raw" أو "menu"' })
  type: ItemType;

  @IsNumber()
  minQty: number;

  @IsNumber()
  maxQty: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  @IsNumber()
  branchId?: number;

  
}
