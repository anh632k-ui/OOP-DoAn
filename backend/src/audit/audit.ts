import { PoolClient } from 'pg';

/** Store audit details in the same transaction as the business action.
 * Never include passwords, JWTs, QR secrets or raw request bodies.
 */
export async function appendAudit(
  client: PoolClient, actorId: string | null,
  action: string, details: Record<string, unknown>,
): Promise<void> {
  await client.query(
    `INSERT INTO nhat_ky_he_thong(ma_nguoi_dung,hanh_dong,chi_tiet)
      VALUES($1,$2,$3::jsonb)`,
    [actorId,action,JSON.stringify(details)],
  );
}
