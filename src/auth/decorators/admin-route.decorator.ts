import { SetMetadata } from '@nestjs/common';

export const AdminRoute = () => SetMetadata('ADMIN_ONLY', true);
