import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { PublicUser } from './auth.types';

export type AuthenticatedRequest = {
  headers: { authorization?: string };
  user?: PublicUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly db: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const header = request.headers.authorization;
    const parts = header?.split(' ') ?? [];
    if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
      throw new UnauthorizedException('Yêu cầu token Bearer');
    }

    let id: unknown;
    try {
      const payload = await this.jwt.verifyAsync<{ sub?: unknown }>(parts[1]);
      id = payload.sub;
    } catch {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã hết hạn');
    }
    if (typeof id !== 'string'
      || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      throw new UnauthorizedException('Token không hợp lệ');
    }

    const [user] = await this.db.queryRows<PublicUser>(
      [
        'SELECT n.ma_nguoi_dung AS id, n.email, n.ho_ten AS name,',
        "COALESCE(array_agg(r.ten_vai_tro) FILTER (WHERE r.ten_vai_tro IS NOT NULL), ARRAY[]::varchar[]) AS roles",
        'FROM nguoi_dung n',
        'LEFT JOIN nguoi_dung_vai_tro nr ON nr.ma_nguoi_dung=n.ma_nguoi_dung',
        'LEFT JOIN vai_tro r ON r.ma_vai_tro=nr.ma_vai_tro',
        "WHERE n.ma_nguoi_dung=$1 AND n.trang_thai='HOAT_DONG'",
        'GROUP BY n.ma_nguoi_dung',
      ].join(' '),
      [id],
    );
    if (!user) throw new UnauthorizedException('Tài khoản không hoạt động');
    request.user = user;
    return true;
  }
}
