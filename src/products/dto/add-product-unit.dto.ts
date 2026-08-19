import { IsNumber, IsString, IsOptional, Min } from 'class-validator';

export class AddProductUnitDto {
    @IsNumber()
    unitId: number;
    
    @IsNumber()
    @Min(0.01, { message: 'يجب أن يكون معامل التحويل أكبر من الصفر' })
    conversionFactor: number;
    
    @IsString()
    @IsOptional()
    barcode?: string;
    
}