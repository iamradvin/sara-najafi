export type AuthenticatedUser = {
  id: string;
  email: string | null;
  name: string;
  roles: string[];
};

export type AuthRequest = {
  headers: {
    cookie?: string;
    origin?: string;
  };
  user?: AuthenticatedUser;
};

export type HeaderResponse = {
  setHeader(name: string, value: string): void;
};
