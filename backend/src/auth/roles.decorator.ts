import { SetMetadata } from '@nestjs/common';
import { RoleName } from './auth.types';

export const ROLES_KEY = 'med06_roles';
export const Roles = (...roles: RoleName[]) => SetMetadata(ROLES_KEY, roles);
