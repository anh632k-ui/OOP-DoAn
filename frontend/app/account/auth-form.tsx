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

  return <main id="main-content" className="auth-page">
    <div className="auth-layout">
      <aside className="auth-visual">
        <div className="auth-visual-header">MED·06 <span>TRẢI NGHIỆM VĂN HÓA</span></div>
        <div className="auth-visual-illustration" aria-hidden="true">
          <div className="auth-orbit"/><div className="auth-disc"/>
          <div className="auth-curve"/>
        </div>
        <div className="auth-visual-bottom">
          <p>Hành trình văn hóa<br/>bắt đầu từ đây.</p>
          <span>Khám phá · Đăng ký · Trải nghiệm</span>
        </div>
      </aside>
      <div className="auth-form-column">
        <Link href="/#su-kien" className="back-link">← Khám phá sự kiện</Link>
        <section className="panel auth-panel" aria-labelledby="form-title">
          <p className="eyebrow">MED-06 · TÀI KHOẢN</p>
          <h1 id="form-title">{register ? 'Tạo tài khoản' : 'Chào mừng trở lại!'}</h1>
          <p className="note">
            {register
              ? 'Đăng ký để chọn suất sự kiện và nhận vé miễn phí.'
              : 'Đăng nhập để quản lý đăng ký và vé điện tử của bạn.'}
          </p>
          <form className="auth-form" onSubmit={submit}>
            {register && <label>Họ và tên
              <input name="name" autoComplete="name" maxLength={160}
                placeholder="Nhập họ và tên của bạn" required/>
            </label>}
            <label>Email
              <input name="email" type="email" autoComplete="email" maxLength={254}
                placeholder="ten@example.com" required/>
            </label>
            <label>Mật khẩu
              <input name="password" type="password"
                autoComplete={register ? 'new-password' : 'current-password'}
                minLength={register ? 10 : undefined} maxLength={128}
                placeholder="Nhập mật khẩu" required/>
            </label>
            {register && <p className="note auth-password-hint">
              Mật khẩu từ 10–128 ký tự, gồm chữ và số.
            </p>}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button type="submit" disabled={pending}>
              {pending ? 'Đang xử lý…' : register ? 'Tạo tài khoản miễn phí' : 'Đăng nhập'}
            </button>
          </form>
          <div className="auth-switch">
            {register ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
            {' '}<Link href={register ? '/account/login' : '/account/register'}>
              {register ? 'Đăng nhập ngay' : 'Tạo tài khoản miễn phí'}
            </Link>
          </div>
        </section>
        <p className="auth-time-note">Lịch sự kiện được hiển thị theo giờ Hà Nội (UTC+7).</p>
      </div>
    </div>
  </main>;
}
