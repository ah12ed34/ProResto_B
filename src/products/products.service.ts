import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository , DataSource} from 'typeorm';
import { Product } from './entities/product.entity';
import { ProductUnit } from './entities/product-unit.entity'; // 1. استدعاء الجدول الوسيط
import { StockMovement } from './entities/stock-movement.entity';
import { Unit } from '../units/entities/unit.entity';
import { AddProductUnitDto } from './dto/add-product-unit.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { BranchProductStock } from './entities/branch-product-stock.entity';
import { User } from 'src/users/entities/user.entity';
import { CreateProductDto } from './dto/create-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private productsRepository: Repository<Product>,
    
    // 2. حقن مستودع الجدول الوسيط لنتعامل معه
    @InjectRepository(ProductUnit)
    private productUnitsRepository: Repository<ProductUnit>, 
    @InjectRepository(Unit)
    private unitsRepos : Repository<Unit>,
    @InjectRepository(BranchProductStock)
    private branchStockRepo: Repository<BranchProductStock>,
    // 3. حقن مصدر البيانات لنتعامل معه
    private dataSource: DataSource,
  ) {}

  // ... (دوال create و findAll و findOne القديمة تبقى كما هي) ...
  async create(productData: CreateProductDto, user: User) {
  // 1. إنشاء QueryRunner من الـ DataSource
  const queryRunner = this.dataSource.createQueryRunner();

  // 2. الاتصال وبدء المعاملة (Transaction)
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    // أ) إنشاء وحفظ المنتج باستخدام manager الخاص بـ queryRunner
    const newProduct = this.productsRepository.create({
      name: productData.name,
      type: productData.type,
      baseUnit: { id: productData.baseUnit }, // ربط بوحدة القياس الأساسية
      minQty: productData.minQty,
      maxQty: productData.maxQty,
    });
    const savedProduct = await queryRunner.manager.save(Product, newProduct);

    const product = Array.isArray(savedProduct) ? savedProduct[0] : savedProduct;
    // ب) إنشاء وحفظ مخزون الفرع
    const branchId = await this.getAccessibleBranchId(user, productData.branchId);
    const branchStock = this.branchStockRepo.create({
      product: product,
      branch: { id: branchId },
      qty: productData.qty,
    });
    await queryRunner.manager.save(BranchProductStock, branchStock);

    // ج) إذا نجحت العمليتان، قم بتأكيد الحفظ في قاعدة البيانات
    await queryRunner.commitTransaction();

    return savedProduct;

  } catch (err) {
    // د) في حال حدوث أي خطأ، قم بالتراجع عن كل التغييرات (Rollback)
    await queryRunner.rollbackTransaction();
    
    // إعادة إلقاء الخطأ ليتعامل معه NestJS إما بطباعة Error أو إرجاع Response للمستخدم
    throw err;

  } finally {
    // هـ) تحرير الـ queryRunner بعد الانتهاء دائماً
    await queryRunner.release();
  }
}

  async findAll(body?: any, user?: User) {
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    const branchId = await this.getAccessibleBranchId(
    user,
    body?.branchId,
  );
  const query = this.productsRepository.createQueryBuilder('product')
    .leftJoinAndSelect('product.baseUnit', 'baseUnit')
    .leftJoinAndSelect('product.productUnits', 'productUnits')
    .leftJoinAndSelect('productUnits.unit', 'unit')
    // ربط المخزون بشرط أن يكون تابعة لفرع المستخدم الحالي
    .leftJoinAndSelect(
      'product.branchStocks', 
      'branchStock', 
      'branchStock.branchId = :branchId', 
      { branchId: branchId }
    );

  // إضافة شرط النوع إذا كان موجوداً
  if (body?.type) {
    query.andWhere('product.type = :type', { type: body.type });
  }

  const products = await query.getMany();

  // (اختياري) تحسين شكل المخرجات لتسهيل القراءة للـ Frontend:
  return products.map(product => {
    // إخراج الكمية مباشرة داخل المنتج كخاصية qty
    const currentStock = product.branchStocks?.[0];
    return {
      ...product,
      qty: currentStock ? currentStock.qty : 0,
      branchStocks: undefined, // إخفاء المصفوفة الأصلية للتنظيف
    };
  });
}

  private getAccessibleBranchId(
  user: User,
  requestedBranchId?: number,
): number {

  // المدير يستطيع اختيار أي فرع
  if (user.role.name === 'admin') {
    return requestedBranchId ?? user.branch.id;
  }

  // المستخدم العادي لا يستطيع تغيير فرعه
  return user.branch.id;
}

  async findOne(id: number) {
    const product = await this.productsRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.baseUnit', 'baseUnit')
      .leftJoinAndSelect('product.productUnits', 'productUnits')
      .leftJoinAndSelect('productUnits.unit', 'unit')
      .leftJoinAndSelect('product.branchStocks', 'branchStock')
      .where('product.id = :id', { id })
      .getOne()
      ;
    if (!product) throw new NotFoundException(`عذراً، الصنف رقم ${id} غير موجود!`);
    return {
      ...product,
      qty: product.branchStocks?.[0]?.qty ?? 0,
      branchStocks: undefined, // إخفاء المصفوفة الأصلية للتنظيف
    };
  }

  // 3. الدالة السحرية الجديدة: إضافة وحدة للصنف
  // async addUnitToProduct(productId: number, data: any) {
  //   // التأكد من أن الصنف موجود أصلاً
  //   await this.findOne(productId); 

  //   // سحر TypeORM: نربط الجداول ببعضها باستخدام الـ ID فقط!
  //   const newProductUnit = this.productUnitsRepository.create({
  //     product: { id: productId }, // ربط بالصنف
  //     unit: { id: data.unitId },  // ربط بوحدة الشوال أو الكرتون
  //     conversionFactor: data.conversionFactor, // الرقم السحري (مثلاً 50)
  //     barcode: data.barcode, // الباركود الخاص بالشوال
  //   });

  //   return await this.productUnitsRepository.save(newProductUnit);
  // }

  // دالة لجلب سجل حركات صنف معين مع تفاصيل الموظف
  async getProductMovements(productId: number) {
    const movements = await this.dataSource.manager.find(StockMovement, {
      where: { product: { id: productId } },
      relations: ['user'], 
      order:  { createdAt: 'DESC' }, 
    });

    // 🌟 تنظيف أمني: مسح كلمة المرور من النتيجة قبل إرسالها
   return movements.map(movement => {
      if (movement.user) {
        // 🌟 إخبار TypeScript بتجاهل القواعد في هذا السطر فقط
        delete (movement.user as any).password; 
      }
      return movement;
    });
  }
  // 🌟 الدالة الجديدة لربط وتحديث وحدات الصنف
  // async addOrUpdateProductUnit(productId: number, dto: AddProductUnitDto) {
  //   // 🌟 1. التحقق من وجود الصنف (مع جلب الوحدة الأساسية)
  //   const product = await this.productsRepository.findOne({ 
  //     where: { id: productId },
  //     relations: ['baseUnit'] // 👈 هذا هو السطر السحري الذي كان ينقصك!
  //   });

  //   if (!product) {
  //     throw new NotFoundException(`الصنف رقم ${productId} غير موجود`);
  //   }

  //   if (!product.baseUnit) {
  //     throw new NotFoundException(`لا يمكن اضافة وحدة فرعية لـ [${product.name}] لأنه لا يحتوي على وحدة أساسية`);
  //   }

  //   if (product.baseUnit.id == dto.unitId) {
  //     throw new NotFoundException("خطأ: لا يجب تحويل الصنف إلى نفس وحدته الأساسية!");
  //   }

  //   // 2. التحقق من وجود الوحدة الفرعية
  //   const unit = await this.unitsRepos.findOne({ where: { id: dto.unitId } });
  //   if (!unit) {
  //     throw new NotFoundException(`الوحدة رقم ${dto.unitId} غير موجودة`);
  //   }

  //   // 3. البحث عما إذا كان هذا الربط موجوداً مسبقاً
  //   let productUnit = await this.productUnitsRepository.findOne({
  //     where: { 
  //       product: { id: productId }, 
  //       unit: { id: dto.unitId } 
  //     }
  //   });

  //   if (productUnit) {
  //     // 🔄 تحديث البيانات إذا كانت العلاقة موجودة
  //     productUnit.conversionFactor = dto.conversionFactor;
  //     if (dto.barcode) productUnit.barcode = dto.barcode;
  //   } else {
  //     // ➕ إنشاء علاقة جديدة
  //     productUnit = this.productUnitsRepository.create({
  //       product: product,
  //       unit: unit,
  //       conversionFactor: dto.conversionFactor,
  //       barcode: dto.barcode,
  //     });
  //   }

  //   // حفظ وإرجاع النتيجة
  //   return await this.productUnitsRepository.save(productUnit);
  // }
  async addProductUnit(productId: number, dto: AddProductUnitDto) {
     const product = await this.productsRepository.findOne({ 
      where: { id: productId },
      relations: ['baseUnit'] // 👈 هذا هو السطر السحري الذي كان ينقصك!
    });

    if (!product) {
      throw new NotFoundException(`الصنف رقم ${productId} غير موجود`);
    }

    if (!product.baseUnit) {
      throw new NotFoundException(`لا يمكن اضافة وحدة فرعية لـ [${product.name}] لأنه لا يحتوي على وحدة أساسية`);
    }

    if (product.baseUnit.id == dto.unitId) {
      throw new NotFoundException("خطأ: لا يجب تحويل الصنف إلى نفس وحدته الأساسية!");
    }

    // 2. التحقق من وجود الوحدة الفرعية
    const unit = await this.unitsRepos.findOne({ where: { id: dto.unitId } });
    if (!unit) {
      throw new NotFoundException(`الوحدة رقم ${dto.unitId} غير موجودة`);
    }

    // 3. البحث عما إذا كان هذا الربط موجوداً مسبقاً
    let productUnit = await this.productUnitsRepository.findOne({
      where: { 
        product: { id: productId }, 
        unit: { id: dto.unitId } ,
        conversionFactor : dto.conversionFactor,
      }
    });

    if (productUnit) {
      // 🔄 تحديث البيانات إذا كانت العلاقة موجودة
      productUnit.conversionFactor = dto.conversionFactor;
      if (dto.barcode) productUnit.barcode = dto.barcode;
    } else {
      // ➕ إنشاء علاقة جديدة
      productUnit = this.productUnitsRepository.create({
        product: product,
        unit: unit,
        conversionFactor: dto.conversionFactor,
        barcode: dto.barcode,
      });
    }

    // حفظ وإرجاع النتيجة
    return await this.productUnitsRepository.save(productUnit);
  }
  // 🌟 تعديل صنف
  async updateProduct(id: number, updateData: UpdateProductDto) {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`الصنف غير موجود`);

    Object.assign(product, updateData);
    return await this.productsRepository.save(product);
  }

  // 🌟 حذف صنف
  async removeProduct(id: number) {
    const product = await this.productsRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException(`الصنف غير موجود`);
    
    // ملاحظة: إذا كان الصنف مرتبطاً بفواتير سابقة، يُفضل عمل Soft Delete (إخفاء) بدلاً من الحذف النهائي
    return await this.productsRepository.remove(product);
  }

  // 🌟 فك الارتباط (حذف معامل التحويل بين الصنف والوحدة الفرعية)
  async removeProductUnit(productId: number, unitId: number) {
    const productUnit = await this.productUnitsRepository.findOne({
      where: { product: { id: productId }, unit: { id: unitId } }
    });
    if (!productUnit) throw new NotFoundException('هذا الربط غير موجود أصلاً');
    
    return await this.productUnitsRepository.remove(productUnit);
  }

}