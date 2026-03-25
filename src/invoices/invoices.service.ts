import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository , DataSource , Between} from 'typeorm';
import { Invoice , InvoiceType } from './entities/invoice.entity';
import { InvoiceItem } from './entities/invoice-item.entity';
import { Product , ItemType } from '../products/entities/product.entity';
import { ProductUnit } from '../products/entities/product-unit.entity'; // 1. استدعاء الجدول الوسيط
import { User } from '../users/entities/user.entity'; // 2. استدعاء جدول المستخدمين
import { UnitConverterService } from './unit.converter.service';
@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice) private invoiceRepo: Repository<Invoice>,
    @InjectRepository(InvoiceItem) private invoiceItemRepo: Repository<InvoiceItem>,
    @InjectRepository(Product) private productRepo: Repository<Product>,
    // 2. حقن الجدول الوسيط للبحث عن معامل التحويل
    @InjectRepository(ProductUnit) private productUnitRepo: Repository<ProductUnit>, 
  
    private dataSource: DataSource,
    private unitConverter: UnitConverterService,
  ) {}


  // ==========================================
  // دالة المشتريات (تزيد المخزون وتوثق المورد)
  // ==========================================
  async createPurchaseInvoice(data: any, user: User) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let totalAmount = 0;

      // 1. إنشاء فاتورة مشتريات
      const invoice = this.invoiceRepo.create({
        type: InvoiceType.PURCHASE, // تحديد نوعها كمشتريات
        partyName: data.supplierName, // اسم المورد أو الشركة
        createdBy: user, // مسؤول المخازن الذي استلم البضاعة
        totalAmount: 0, 
      });

      const savedInvoice = await queryRunner.manager.save(invoice);

     // 2. معالجة الأصناف المستلمة (زيادة الرصيد)
      for (const item of data.items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(`الصنف رقم ${item.productId} غير موجود`);
        }

        if (product.type === ItemType.MENU) {
          throw new BadRequestException(`خطأ: لا يمكنك تخزين أصناف جاهزة (${product.name}) في المخزن! المشتريات للمواد الخام فقط.`);
        }

        // 🌟 التعديل السحري: إجبار السيرفر على قراءة القيم كأرقام صريحة
        const currentQty = Number(product.qty) || 0;
        const incomingQty = Number(item.quantity) || 0;

       const baseQty = await this.unitConverter.toBaseUnit(
  item.productId,
  item.unitId,
  item.quantity,
  queryRunner.manager
);

product.qty = currentQty + baseQty;
        await queryRunner.manager.save(product);

        // --- توثيق حركة (دخول) للمخزن ---
        const movementData = {
          product: product,
          type: 'in', // دخول
          quantity: incomingQty,
          balanceAfter: product.qty, // الرصيد الجديد الذي حسبناه
          description: `فاتورة مشتريات رقم #${savedInvoice.id} - المورد: ${savedInvoice.partyName}`,
          user: user,
        };
        // نستخدم المانجر للحفظ مباشرة داخل الـ Transaction
        await queryRunner.manager.save('StockMovement', movementData);

        // حساب تكلفة الشراء
        const itemTotal = incomingQty * item.unitPrice;
        totalAmount += itemTotal;

        // تسجيل تفاصيل الصنف في الفاتورة
        const invoiceItem = this.invoiceItemRepo.create({
          invoice: savedInvoice,
          product: product,
          quantity: incomingQty,
          unitPrice: item.unitPrice,
          totalPrice: itemTotal,
          unit: { id: item.unitId }
        });

        await queryRunner.manager.save(invoiceItem);
        
      }

      savedInvoice.totalAmount = totalAmount;
      await queryRunner.manager.save(savedInvoice);

      await queryRunner.commitTransaction();
      return savedInvoice;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  // =========================================================
  // دالة المبيعات (الجديدة - تخصم من المخزون بذكاء)
  // =========================================================
 // ==========================================
  // دالة المبيعات (تخصم المخزون وتسجل حركة الخروج)
  // ==========================================
  async createSalesInvoice(data: any, user: User) {
    // 1. تشغيل "الحارس المالي" لضمان عدم حدوث أخطاء نصفية
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let totalAmount = 0;

      // 2. إنشاء الفاتورة الأساسية
      const invoice = this.invoiceRepo.create({
        type: InvoiceType.SALE, // نوع الفاتورة: بيع
        partyName: data.customerName || 'عميل نقدي',
        createdBy: user, // الكاشير
        totalAmount: 0, 
      });

      const savedInvoice = await queryRunner.manager.save(invoice);
      // 3. معالجة الأصناف (خصم المخزون وتسجيل الحركة)
      for (const item of data.items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(`الصنف رقم ${item.productId} غير موجود`);
        }
        
        // 🌟 التحويل الآمن لأرقام (لحل مشكلة الجافاسكربت)
        // const currentQty = Number(product.qty) || 0;
        const soldQty = Number(item.quantity) || 0;

        // 🌟 حماية إضافية: منع البيع بالسالب (اختياري)
        // if (currentQty < soldQty) {
        //   throw new Error(`عذراً، الرصيد غير كافٍ للصنف: ${product.name}. المتاح: ${currentQty}`);
        // }

       if (product.type === 'raw') {
          throw new BadRequestException(`خطأ أمني: الكاشير لا يمكنه بيع مواد خام (${product.name}) للزبون مباشرة!`);
        }

        // بما أنه صنف MENU (يُصنع لحظياً)، لن نخصم من المخزون هنا
        // سنكتفي بتسجيله في الفاتورة لحساب الأرباح فقط
        const itemTotal = soldQty * item.unitPrice;
        totalAmount += itemTotal;

        const invoiceItem = this.invoiceItemRepo.create({
          invoice: savedInvoice,
          product: product,
          quantity: soldQty,
          unitPrice: item.unitPrice,
          totalPrice: itemTotal,
        });
        await queryRunner.manager.save(invoiceItem);

        // 🌟 4. توثيق حركة (خروج) من المخزن لكاميرا المراقبة
        const movementData = {
          product: product,
          type: 'out', // حركة خروج
          quantity: soldQty,
          balanceAfter: product.qty, // الرصيد المتبقي بعد البيع
          description: `فاتورة مبيعات رقم #${savedInvoice.id} - الكاشير: ${user.name}`,
          user: user,
        };
        await queryRunner.manager.save('StockMovement', movementData);
      }

      // 5. حفظ الإجمالي النهائي للفاتورة
      savedInvoice.totalAmount = totalAmount;
      await queryRunner.manager.save(savedInvoice);

      // اعتماد العملية بالكامل
      await queryRunner.commitTransaction();
      return savedInvoice;
      
    } catch (err) {
      // إذا حدث أي خطأ (مثل عدم توفر رصيد)، تراجع عن كل شيء!
      await queryRunner.rollbackTransaction();
      throw err; 
    } finally {
      // إغلاق الاتصال لتوفير موارد السيرفر
      await queryRunner.release();
    }
  }
  // ==========================================
  // دالة صرف المواد للمطبخ (Kitchen Issue)
  // ==========================================
  async createIssueInvoice(data: any, user: User) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. إنشاء سند صرف
      const invoice = this.invoiceRepo.create({
        type: InvoiceType.ISSUE,
        partyName: data.kitchenName || 'المطبخ الرئيسي', // المستلم
        createdBy: user, // مسؤول المخازن
        totalAmount: 0, 
      });

      const savedInvoice = await queryRunner.manager.save(invoice);

      // 2. خصم المواد الخام من المخزن
      for (const item of data.items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: item.productId },
        });

        if (!product || product.type !== 'raw') {
          throw new BadRequestException(`الصنف ${item.productId} إما غير موجود أو ليس مادة خاماً!`);
        }

        const currentQty = Number(product.qty) || 0;
        const issuedQty = await this.unitConverter.toBaseUnit(
  item.productId,
  item.unitId,
  item.quantity,
  queryRunner.manager
);

if (currentQty < issuedQty) {
  throw new BadRequestException('رصيد غير كافي');
}

product.qty = currentQty - issuedQty;
        await queryRunner.manager.save(product);

        // توثيق حركة الخروج في الصندوق الأسود (Ledger)
        const movementData = {
          product: product,
          type: 'out',
          quantity: issuedQty,
          balanceAfter: product.qty,
          description: `سند صرف للمطبخ رقم #${savedInvoice.id}`,
          user: user,
        };
        await queryRunner.manager.save('StockMovement', movementData);
      }

      await queryRunner.commitTransaction();
      return savedInvoice;
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
  async getDailyReport(body: any) {
    // تحديد بداية ونهاية اليوم الحالي
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // جلب مبيعات اليوم
    const sales = await this.invoiceRepo.find({
      where: { type: InvoiceType.SALE, createdAt: Between(startOfDay, endOfDay) , createdBy : { id : body?.userId } },
      relations: ['createdBy'],
    });
    for (const sale of sales) {
      if(sale.createdBy) {
        delete (sale.createdBy as any).password; // 🌟 تنظيف كلمة المرور (: any )password ;
      }
    }

    // جلب مشتريات اليوم
    const purchases = await this.invoiceRepo.find({
      where: { type: InvoiceType.PURCHASE, createdAt: Between(startOfDay, endOfDay) , createdBy : { id : body?.userId } },
      relations: ['createdBy'],
    });
    for (const purchase of purchases) {
      if(purchase.createdBy) {
        delete (purchase.createdBy as any).password; // 🌟 تنظيف كلمة المرور (: any )password ;
      }
    }

    // حساب المجاميع
    const totalSales = sales.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);
    const totalPurchases = purchases.reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

    return {
      date: startOfDay.toISOString().split('T')[0],
      totalSales,
      salesCount: sales.length,
      totalPurchases,
      purchasesCount: purchases.length,
      netCash: totalSales - totalPurchases, // الكاش المفترض وجوده في الدرج
      salesDetails: sales, // تفاصيل الفواتير لعرضها للمدير
    };
  }

}