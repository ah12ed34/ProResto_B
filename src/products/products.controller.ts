import { Controller, Get, Post, Body, UseGuards, Param , Patch , Delete , Req } from '@nestjs/common'; // أضفنا Param
import { ProductsService } from './products.service';
import { PermissionsGuard } from '../auth/permissions.guard'; // استدعاء الحارس
import { RequirePermissions } from '../auth/permissions.decorator'; // استدعاء الختم
import { ItemType } from './entities/product.entity';
import { AddProductUnitDto } from './dto/add-product-unit.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('products')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @RequirePermissions('create_products') // تحديد الصلاحية المطلوبة
  create(@Body() body: any, @Req() request: any) {
    return this.productsService.create(body, request.user);
  }

  @Get()
  @RequirePermissions('view_products') // تحديد الصلاحية المطلوبة
  findAll(@Body() body?: {type : ItemType}, @Req() request?: any) {
    return this.productsService.findAll(body, request.user);
  }

  @Get(':id')
  @RequirePermissions('view_products')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(+id);
  }

  // المسار الجديد: إضافة وحدة لمعامل التحويل
  // الرابط سيكون: POST /products/:id/units
  // @Post(':id/units')
  // @RequirePermissions('update_products') // تحديد الصلاحية المطلوبة
  // addUnit(@Param('id') id: string, @Body() body: any) {
  //   return this.productsService.addUnitToProduct(+id, body);
  // }
  @Get(':id/movements')
  @RequirePermissions('view_reports') // يمكنك تفعيل الحماية لاحقاً للمدير فقط
  getProductMovements(@Param('id') id: string) {
    return this.productsService.getProductMovements(+id);
  }

  @Post(':id/units')
  async addUnitToProduct(
    @Param('id') productId: string,
    @Body() dto: AddProductUnitDto
  ) {
    return this.productsService.addProductUnit(+productId, dto);
  }

  @Patch(':id')
  updateProduct(@Param('id') id: string, @Body() updateData: UpdateProductDto) {
    return this.productsService.updateProduct(+id, updateData);
  }

  @Delete(':id')
  removeProduct(@Param('id') id: string) {
    return this.productsService.removeProduct(+id);
  }

  @Delete(':id/units/:unitId')
  removeUnitFromProduct(@Param('id') id: string, @Param('unitId') unitId: string) {
    return this.productsService.removeProductUnit(+id, +unitId);
  }
}