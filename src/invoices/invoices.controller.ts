import { Controller, Post ,Get,UseGuards, Body ,Req ,Query} from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { PermissionsGuard } from '../auth/permissions.guard'; // استدعاء الحارس
import { RequirePermissions } from '../auth/permissions.decorator'; // استدعاء الختم
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
@Controller('invoices')
@UseGuards(JwtAuthGuard, PermissionsGuard)
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
@RequirePermissions('view_reports')
getDailyReport(@Req() request: any, @Query('userId') userId?: string) {

  const currentUser = request.user;

  // لو المستخدم مدير → يقدر يحدد userId
  if (userId && currentUser.role.permissions.includes('view_all_reports')) {
    return this.invoicesService.getDailyReport(+userId);
  }

  // غير ذلك → يرجع تقرير نفسه فقط
  return this.invoicesService.getDailyReport(currentUser.id);
}
}