import type {
  NextFunction,
  Request,
  Response,
} from "express";

import { prisma } from "../lib/prisma";

import { verifyToken } from "../utils/jwt";

export type UserRole =
  | "ADMIN"
  | "TEACHER"
  | "PARENT";

export type AuthenticatedRequest = Request & {
  auth?: {
    userId: number;
    role: UserRole;
  };
};

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const token = req.cookies?.ktn_token;

  if (!token) {
    return res.status(401).json({
      message: "Authentication required",
    });
  }

  try {
    const payload = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: {
        id: payload.userId,
      },

      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      res.clearCookie("ktn_token", {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
      });

      return res.status(401).json({
        message:
          "Your account is inactive or no longer available",
      });
    }

    if (user.role !== payload.role) {
      res.clearCookie("ktn_token", {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
      });

      return res.status(401).json({
        message: "Invalid session",
      });
    }

    req.auth = {
      userId: user.id,
      role: user.role as UserRole,
    };

    next();
  } catch {
    res.clearCookie("ktn_token", {
      httpOnly: true,
      secure:
        process.env.NODE_ENV ===
        "production",
      sameSite: "lax",
    });

    return res.status(401).json({
      message: "Invalid or expired session",
    });
  }
}

export function requireRole(
  ...allowedRoles: UserRole[]
) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.auth) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (
      !allowedRoles.includes(
        req.auth.role
      )
    ) {
      return res.status(403).json({
        message:
          "You do not have permission to access this resource",
      });
    }

    next();
  };
}