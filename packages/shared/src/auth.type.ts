export type AuthUser = {
  id: number;
  email: string;
  name: string;
};
export type LoginResult = {
  accessToken: string;
  user: AuthUser;
};

export type MeResult = AuthUser & {
  createdAt: string;
};

export type ApiSuccess<T> = { data: T };
