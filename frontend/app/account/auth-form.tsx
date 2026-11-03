'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';

export default function AuthForm({ mode }: { mode: 'register' | 'login' }) {
  const register = mode === 'register';
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    const fields = new FormData(event.currentTarget);
    const body: Record<string, string> = {
      email: String(fields.get('email') ?? ''),
      password: String(fields.get('password') ?? ''),
    };
    if (register) body.name = String(fields.get('name') ?? '');

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const result = (await response.json()) as { message?: string | string[] };
        const message = Array.isArray(result.message)
          ? result.message.join(', ')
          : result.message;
        setError(message ?? 'Không thể xác thực, vui lòng thử lại');
        return;
      }
      window.location.assign('/account');
    } catch {
      setError('Không thể kết nối máy chủ. Vui lòng thử lại.');
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="container auth-container">
      <Link href="/">← Về trang sự kiện</Link>
      <section className="panel" aria-labelledby="form-title">
        <h1 id="form-title">{register ? 'Đăng ký tài khoản' : 'Đăng nhập'}</h1>
        <p className="note">
          {register
            ? 'Tài khoản mới được cấp vai trò Người tham dự.'
            : 'Đăng nhập để xem thông tin tài khoản.'}
        </p>
        <form className="auth-form" onSubmit={submit}>
          {register && (
            <label>
              Họ và tên
              <input name="name" autoComplete="name" maxLength={160} required />
            </label>
          )}
          <label>
            Email
            <input name="email" type="email" autoComplete="email" maxLength={254} required />
          </label>
          <label>
            Mật khẩu
            <input
              name="password"
              type="password"
              autoComplete={register ? 'new-password' : 'current-password'}
              minLength={register ? 10 : undefined}
              maxLength={128}
              required
            />
          </label>
          {register && (
            <p className="note">Mật khẩu từ 10–128 ký tự, phải có chữ và số.</p>
          )}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" disabled={pending}>
            {pending ? 'Đang xử lý…' : register ? 'Tạo tài khoản' : 'Đăng nhập'}
          </button>
        </form>
        <p>
          {register ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
          {' '}
          <Link href={register ? '/account/login' : '/account/register'}>
            {register ? 'Đăng nhập' : 'Đăng ký'}
          </Link>
        </p>
      </section>
    </main>
  );
}
