export const ROLE_NAMES = ['ATTENDEE', 'ORGANIZER', 'CHECKIN', 'ADMIN'] as const;
export type RoleName = (typeof ROLE_NAMES)[number];

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  roles: RoleName[];
};

export type AuthResult = {
  accessToken: string;
  tokenType: 'Bearer';
  user: PublicUser;
};

export type IdentityRecord = PublicUser & {
  passwordHash: string | null;
};
