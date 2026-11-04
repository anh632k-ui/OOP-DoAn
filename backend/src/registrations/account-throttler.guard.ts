import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { PublicUser } from '../auth/auth.types';

// JWT and Roles guards run before this guard, so account identity is trusted.
// Multiple legitimate students behind a university NAT do not share one bucket.
// Public login/registration endpoints retain their separate IP throttles.
@Injectable()
export class AccountThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(request: Record<string, unknown>): Promise<string> {
    const user = request.user as PublicUser | undefined;
    if (typeof user?.id === 'string') return 'account:' + user.id;
    return super.getTracker(request);
  }
}
