import { Controller, Post ,Get,UseGuards, Body ,Req} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { PermissionsGuard } from '../auth/permissions.guard'; // استدعاء الحارس
import { RequirePermissions } from '../auth/permissions.decorator'; // استدعاء الختم
@Controller('invoices')
@UseGuards(PermissionsGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  // رابط المشتريات (لزيادة المخزن)
  @Post('purchases')
  @RequirePermissions('create_purchases') // صلاحية خاصة بمسؤول المخازن
  createPurchases(@Body() body: any, @Req() request: any) {
    return this.invoicesService.createPurchaseInvoice(body, request.user);
  }
  // رابط المبيعات الجديد (لخصم المخزن)
  @Post('sales')
  @RequirePermissions('create_sales')
  createSales(@Body() body: any, @Req() request: any) {
    return this.invoicesService.createSalesInvoice(body, request.user);
  }

  // رابط سند الصرف الداخلي للمطبخ
  @Post('issue')
  @RequirePermissions('create_issues') // صلاحية خاصة بالمطبخ
  createIssue(@Body() body: any, @Req() request: any) {
    return this.invoicesService.createIssueInvoice(body, request.user);
  }

  @Get('daily-report')
  @RequirePermissions('view_reports') // يمكنك تفعيلها لاحقاً للمدير فقط
  getDailyReport() {
    return this.invoicesService.getDailyReport();
  }
}