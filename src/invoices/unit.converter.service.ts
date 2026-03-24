import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ProductUnit } from '../products/entities/product-unit.entity';
import { Product } from '../products/entities/product.entity';
@Injectable()
export class UnitConverterService {
  constructor(private dataSource: DataSource) {}

  async toBaseUnit(
    productId: number,
    unitId: number,
    quantity: number,
    manager?: any,
  ): Promise<number> {
    const repo = manager
      ? manager.getRepository(ProductUnit)
      : this.dataSource.getRepository(ProductUnit);

    const productUnit = await repo.findOne({
      where: {
        product: { id: productId },
        unit: { id: unitId },
      },
      relations: ['unit', 'product'],
    });
    if (!productUnit) {
        const product = await manager.findOne(Product, {
            where: {
                id: productId ,
                baseUnit: unitId
            }
        })
        if(product) {
            return Number(quantity)
        }
      throw new BadRequestException(
        `❌ هذه الوحدة غير مرتبطة بالمنتج (productId=${productId}, unitId=${unitId})`,
      );
    }

    const qty = Number(quantity) || 0;
    const factor = Number(productUnit.conversionFactor) || 0;

    return qty * factor;
  }
}