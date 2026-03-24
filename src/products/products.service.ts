import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository , DataSource} from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductUnit } from './entities/product-unit.entity'; // 1. استدعاء الجدول الوسيط
import { StockMovement } from './entities/stock-movement.entity';
import { Unit } from '../units/entities/unit.entity';
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    
    // 2. حقن مستودع الجدول الوسيط لنتعامل معه
    @InjectRepository(ProductUnit)
    private productUnitsRepository: Repository<ProductUnit>, 

    // 3. حقن مصدر البيانات لنتعامل معه
    private dataSource: DataSource,
  ) {}

  // ... (دوال create و findAll و findOne القديمة تبقى كما هي) ...
  create(productData: any) {
    const newProduct = this.productsRepository.create(productData);
    return this.productsRepository.save(newProduct);
  }

  async findAll(body?: any) {
  const whereClause: any = {};

  if (body?.type) {
    whereClause.type = body.type;
  }

  const products = await this.productsRepository.find({
    where: whereClause,
    relations: {
      productUnits: {
        unit: true,
      },
      baseUnit: true,
    },
  });

  return products;
}

  async findOne(id: number) {
    const product = await this.productsRepository.findOne({ where: { id: id } });
    if (!product) throw new NotFoundException(`عذراً، الصنف رقم ${id} غير موجود!`);
    return product;
  }

  // 3. الدالة السحرية الجديدة: إضافة وحدة للصنف
  async addUnitToProduct(productId: number, data: any) {
    // التأكد من أن الصنف موجود أصلاً
    await this.findOne(productId); 

    // سحر TypeORM: نربط الجداول ببعضها باستخدام الـ ID فقط!
    const newProductUnit = this.productUnitsRepository.create({
      product: { id: productId }, // ربط بالصنف
      unit: { id: data.unitId },  // ربط بوحدة الشوال أو الكرتون
      conversionFactor: data.conversionFactor, // الرقم السحري (مثلاً 50)
      barcode: data.barcode, // الباركود الخاص بالشوال
    });

    return await this.productUnitsRepository.save(newProductUnit);
  }

  // دالة لجلب سجل حركات صنف معين مع تفاصيل الموظف
  async getProductMovements(productId: number) {
    return this.dataSource.manager.find(StockMovement, {
      where: { product: { id: productId } },
      relations: ['user'], // لنجلب اسم الموظف الذي قام بالحركة
      order:  { createdAt: 'DESC' }, // ترتيب من الأحدث للأقدم
    });
  }
}