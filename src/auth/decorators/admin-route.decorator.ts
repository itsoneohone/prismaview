import { SetMetadata } from '@nestjs/common';

export const ADMIN_ONLY_KEY = 'ADMIN_ONLY';
export const AdminRoute = () => SetMetadata('ADMIN_ONLY_KEY', true);
