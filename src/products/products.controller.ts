import { Controller, Get, Post, Body, UseGuards, Param } from '@nestjs/common'; // أضفنا Param
import { ProductsService } from './products.service';
import { PermissionsGuard } from '../auth/permissions.guard'; // استدعاء الحارس
import { RequirePermissions } from '../auth/permissions.decorator'; // استدعاء الختم
import { ItemType } from './entities/product.entity';
@Controller('products')
@UseGuards(PermissionsGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @RequirePermissions('create_products') // تحديد الصلاحية المطلوبة
  create(@Body() body: any) {
    return this.productsService.create(body);
  }

  @Get()
  @RequirePermissions('view_products') // تحديد الصلاحية المطلوبة
  findAll(@Body() body?: {type : ItemType}) {
    return this.productsService.findAll(body);
  }

  @Get(':id')
  @RequirePermissions('view_products')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  // المسار الجديد: إضافة وحدة لمعامل التحويل
  // الرابط سيكون: POST /products/:id/units
  @Post(':id/units')
  @RequirePermissions('update_products') // تحديد الصلاحية المطلوبة
  addUnit(@Param('id') id: string, @Body() body: any) {
    return this.productsService.addUnitToProduct(+id, body);
  }
  @Get(':id/movements')
  @RequirePermissions('view_reports') // يمكنك تفعيل الحماية لاحقاً للمدير فقط
  getProductMovements(@Param('id') id: string) {
    return this.productsService.getProductMovements(+id);
  }
}