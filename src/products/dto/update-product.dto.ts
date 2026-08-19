import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsNumber, IsString , isNotEmptyObject ,IsOptional } from "class-validator"
export class UpdateProductDto extends PartialType(CreateProductDto) {
    @IsNumber()
    baseUnit : number;

}
