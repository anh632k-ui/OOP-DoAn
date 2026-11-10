import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { PasswordService } from './password.service';
import { AuthResult, IdentityRecord, PublicUser } from './auth.types';

function isObject(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeEmail(value: unknown): string {
  if (typeof value !== 'string') {
    throw new BadRequestException('Email phải là chuỗi ký tự');
  }
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new BadRequestException('Email không đúng định dạng');
  }
  return email;
}

function validatePassword(password: unknown): string {
  if (typeof password !== 'string'
    || password.length < 10 || password.length > 128
    || !/[a-zA-Z]/.test(password)
    || !/[0-9]/.test(password)) {
    throw new BadRequestException(
      'Mật khẩu phải có 10–128 ký tự, gồm chữ và số',
    );
  }
  return password;
}

function validateName(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()
    || value.trim().length > 160) {
    throw new BadRequestException('Họ tên không hợp lệ (tối đa 160 ký tự)');
  }
  return value.trim();
}

@Injectable()
export class AuthService {
  constructor(
    private readonly db: DatabaseService,
    private readonly password: PasswordService,
    private readonly jwt: JwtService,
  ) {}

  private async userWithRoles(id: string): Promise<PublicUser | undefined> {
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
    return user;
  }

  private async issueToken(id: string): Promise<AuthResult> {
    const user = await this.userWithRoles(id);
    if (!user) throw new UnauthorizedException('Tài khoản không hoạt động');
    const accessToken = await this.jwt.signAsync({ sub: id });
    return { accessToken, tokenType: 'Bearer', user };
  }

  async register(body: unknown): Promise<AuthResult> {
    if (!isObject(body)) throw new BadRequestException('Dữ liệu không hợp lệ');
    const email = normalizeEmail(body.email);
    const name = validateName(body.name);
    const password = validatePassword(body.password);
    const passwordHash = await this.password.hash(password);

    try {
      const id = await this.db.transaction(async (client) => {
        const created = await client.query<{ id: string }>(
          'INSERT INTO nguoi_dung(email, ho_ten, mat_khau_hash) VALUES($1, $2, $3) RETURNING ma_nguoi_dung AS id',
          [email, name, passwordHash],
        );
        const userId = created.rows[0].id;
        const assignment = await client.query(
          "INSERT INTO nguoi_dung_vai_tro(ma_nguoi_dung, ma_vai_tro) SELECT $1, ma_vai_tro FROM vai_tro WHERE ten_vai_tro='ATTENDEE' RETURNING ma_vai_tro",
          [userId],
        );
        if (assignment.rowCount !== 1) {
          throw new Error('Chưa cấu hình vai trò ATTENDEE trong database');
        }
        return userId;
      });
      return this.issueToken(id);
    } catch (error: unknown) {
      if (isObject(error) && error.code === '23505') {
        throw new ConflictException('Email đã được sử dụng');
      }
      throw error;
    }
  }

  async login(body: unknown): Promise<AuthResult> {
    if (!isObject(body)) throw new BadRequestException('Dữ liệu không hợp lệ');
    const email = normalizeEmail(body.email);
    if (typeof body.password !== 'string' || !body.password
      || body.password.length > 128) {
      throw new BadRequestException('Mật khẩu không hợp lệ');
    }
    const [record] = await this.db.queryRows<IdentityRecord>(
      "SELECT ma_nguoi_dung AS id, mat_khau_hash AS \"passwordHash\" FROM nguoi_dung WHERE lower(email)=$1 AND trang_thai='HOAT_DONG'",
      [email],
    );
    // Equal-cost verification prevents a cheap user-enumeration signal.
    const placeholderHash = await this.password.hash('placeholder-Password-987');
    const valid = await this.password.verify(
      body.password,
      record?.passwordHash ?? placeholderHash,
    );
    if (!record || !valid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }
    return this.issueToken(record.id);
  }
  async organizerRequestStatus(user: PublicUser) {
    const [application] = await this.db.queryRows<{
      id: string; status: string; reason: string; createdAt: Date;
    }>(`SELECT ma_yeu_cau AS id, trang_thai AS status,
         ly_do AS reason, tao_luc AS "createdAt"
       FROM yeu_cau_to_chuc WHERE ma_nguoi_dung=$1`, [user.id]);
    return { application: application ?? null };
  }

  async requestOrganizer(user: PublicUser, body: unknown) {
    if (!isObject(body) || typeof body.reason !== 'string'
      || body.reason.trim().length < 10 || body.reason.trim().length > 500) {
      throw new BadRequestException('Hãy giới thiệu mục đích tổ chức sự kiện (10–500 ký tự).');
    }
    if (user.roles.includes('ORGANIZER') || user.roles.includes('ADMIN')) {
      throw new ConflictException('Tài khoản đã có quyền tổ chức sự kiện');
    }
    return this.db.transaction(async client => {
      const [account] = (await client.query<{ status: string }>(
        `SELECT trang_thai AS status FROM nguoi_dung WHERE ma_nguoi_dung=$1 FOR UPDATE`,
        [user.id],
      )).rows;
      if (!account || account.status !== 'HOAT_DONG') {
        throw new ConflictException('Tài khoản không hoạt động');
      }
      const existing = await client.query<{ id: string; status: string }>(
        `SELECT ma_yeu_cau AS id,trang_thai AS status
         FROM yeu_cau_to_chuc WHERE ma_nguoi_dung=$1 FOR UPDATE`,
        [user.id],
      );
      if (existing.rows[0]?.status === 'CHO_DUYET') {
        throw new ConflictException('Yêu cầu đang chờ quản trị viên duyệt');
      }
      if (existing.rows[0]?.status === 'DA_DUYET') {
        throw new ConflictException('Yêu cầu đã được duyệt');
      }
      const reason = body.reason.trim();
      const [application] = (await client.query<{ id: string }>(
        `INSERT INTO yeu_cau_to_chuc(ma_nguoi_dung,ly_do) VALUES($1,$2)
         ON CONFLICT(ma_nguoi_dung) DO UPDATE SET
           ly_do=EXCLUDED.ly_do,trang_thai='CHO_DUYET',
           tao_luc=now(),xu_ly_luc=NULL,ma_nguoi_duyet=NULL
         RETURNING ma_yeu_cau AS id`,
        [user.id,reason],
      )).rows;
      await client.query(
        `INSERT INTO nhat_ky_he_thong(ma_nguoi_dung,hanh_dong,chi_tiet)
         VALUES($1,'YEU_CAU_TO_CHUC',$2::jsonb)`,
        [user.id,JSON.stringify({applicationId:application.id})],
      );
      return { id: application.id, status: 'CHO_DUYET' };
    });
  }

}
