export type UserStatus = "online" | "idle" | "dnd" | "invisible";

/** The signed-in user, as the client sees them. */
export type Me = {
  id: string;
  email: string;
  username: string;
  avatarSeed: string;
  about: string;
  status: UserStatus;
  createdAt: number;
};

export type SessionInfo = {
  id: string;
  userAgent: string;
  city: string | null;
  createdAt: number;
  lastSeenAt: number;
  current: boolean;
};
