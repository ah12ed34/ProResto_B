import { SetMetadata } from '@nestjs/common';

// هذا الختم سنضعه فوق الدوال لتحديد الصلاحيات المطلوبة
export const RequirePermissions = (...permissions: string[]) => SetMetadata('permissions', permissions);