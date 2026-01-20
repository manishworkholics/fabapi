export type JWTPayload = {
  email: string;
  userId: number;
};

export type JWTPayloadWithRefreshToken = JWTPayload & {
  refreshToken: string;
};
