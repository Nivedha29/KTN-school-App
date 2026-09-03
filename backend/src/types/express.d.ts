import type { Role } from "../generated/prisma/client";

export {};

declare global {
  namespace Express {
    interface Request {
      auth?: {
        userId: number;
        role: Role;
      };
    }
  }
}