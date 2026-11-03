import {
  BadRequestException, ConflictException, ForbiddenException, Injectable,
  NotFoundException, ServiceUnavailableException, StreamableFile,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client,
} from '@aws-sdk/client-s3';
import { DatabaseService } from '../database/database.service';
import { PublicUser } from '../auth/auth.types';

export type UploadedImage = {
  buffer: Buffer;
  size: number;
  mimetype: string;
} | undefined;

type RecordRow = {
  id: string; owner: string; status: string; key: string | null;
};

function format(file: UploadedImage): { type: string; ext: string } {
  if (!file?.buffer || file.size <= 0 || file.size > 2 * 1024 * 1024) {
    throw new BadRequestException('Ảnh không hợp lệ hoặc vượt quá 2 MB');
  }
  const bytes = file.buffer;
  if (file.mimetype === 'image/png'
      && bytes.subarray(0, 8).equals(Buffer.from('89504e470d0a1a0a','hex'))) {
    return { type: 'image/png', ext: 'png' };
  }
  if (file.mimetype === 'image/jpeg'
      && bytes.subarray(0, 3).equals(Buffer.from('ffd8ff','hex'))) {
    return { type: 'image/jpeg', ext: 'jpg' };
  }
  if (file.mimetype === 'image/webp'
      && bytes.subarray(0, 4).toString('ascii') === 'RIFF'
      && bytes.subarray(8, 12).toString('ascii') === 'WEBP') {
    return { type: 'image/webp', ext: 'webp' };
  }
  throw new BadRequestException('Chỉ nhận ảnh PNG, JPEG hoặc WebP hợp lệ');
}

@Injectable()
export class MediaService {
  private readonly bucket = process.env.S3_BUCKET || 'med06-media';
  private readonly storage = new S3Client({
    region: 'us-east-1',
    endpoint: process.env.S3_ENDPOINT || 'http://objectstore:8333',
    forcePathStyle: true,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || 'med06_local_access',
      secretAccessKey: process.env.S3_SECRET_KEY || 'med06_local_secret_key_change_me',
    },
  });

  constructor(private readonly db: DatabaseService) {}

  async uploadCover(user: PublicUser, eventId: string, file: UploadedImage) {
    const { type, ext } = format(file);
    const key = `events/${eventId}/${randomUUID()}.${ext}`;
    const previous = await this.db.transaction(async client => {
      const found = await client.query<RecordRow>(
        `SELECT ma_su_kien AS id,ma_nguoi_to_chuc AS owner,
          trang_thai AS status,anh_bia_key AS key
        FROM su_kien WHERE ma_su_kien=$1 FOR UPDATE`, [eventId],
      );
      const event = found.rows[0];
      if (!event) throw new NotFoundException('Không tìm thấy sự kiện');
      if (!user.roles.includes('ADMIN') && event.owner !== user.id) {
        throw new ForbiddenException('Không được sửa ảnh sự kiện này');
      }
      if (event.status !== 'NHAP') {
        throw new ConflictException('Chỉ sửa ảnh của sự kiện nháp');
      }
      try {
        await this.storage.send(new PutObjectCommand({
          Bucket: this.bucket, Key: key,
          Body: file!.buffer, ContentType: type,
        }));
      } catch {
        throw new ServiceUnavailableException('Object storage không sẵn sàng');
      }
      await client.query(`UPDATE su_kien SET anh_bia_key=$2
        WHERE ma_su_kien=$1`, [eventId,key]);
      return event.key;
    });
    // Object deletion is best-effort; never delete the current cover on failure.
    if (previous) {
      try {
        await this.storage.send(new DeleteObjectCommand({
          Bucket: this.bucket, Key: previous,
        }));
      } catch { /* Retention clean-up can be retried administratively. */ }
    }
    return { eventId, hasCover: true };
  }

  async getCover(eventId: string): Promise<StreamableFile> {
    const [event] = await this.db.queryRows<{ key: string | null }>(
      `SELECT anh_bia_key AS key FROM su_kien
        WHERE ma_su_kien=$1 AND trang_thai='DA_CONG_BO'`, [eventId],
    );
    if (!event?.key) throw new NotFoundException('Sự kiện không có ảnh công khai');
    try {
      const response = await this.storage.send(new GetObjectCommand({
        Bucket: this.bucket, Key: event.key,
      }));
      if (!response.Body) throw new NotFoundException('Không tìm thấy tệp ảnh');
      const buffer = Buffer.from(await response.Body.transformToByteArray());
      if (buffer.byteLength > 2 * 1024 * 1024) {
        throw new ServiceUnavailableException('Tệp ảnh vượt kích thước cho phép');
      }
      const type = event.key.endsWith('.png') ? 'image/png'
        : event.key.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
      return new StreamableFile(buffer, {
        type, length: buffer.byteLength, disposition: 'inline',
      });
    } catch (error) {
      if (error instanceof NotFoundException
        || error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException('Object storage chưa sẵn sàng');
    }
  }
}
