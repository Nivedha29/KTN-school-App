import { Router } from "express";

import argon2 from "argon2";

import { z } from "zod";

import { prisma } from "../lib/prisma";

import {
  requireAuth,
  type AuthenticatedRequest,
} from "../middleware/auth";

import { createToken } from "../utils/jwt";

const router = Router();

/* =========================================================
   VALIDATION SCHEMAS
========================================================= */

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email(),

  password: z
    .string()
    .min(6),
});

const parentRegisterSchema = z.object({
  name: z
    .string()
    .trim()
    .min(
      2,
      "Parent/Guardian name is required"
    ),

  email: z
    .string()
    .trim()
    .email(
      "Please enter a valid email address"
    ),

  password: z
    .string()
    .min(
      8,
      "Password must be at least 8 characters"
    ),

  phone: z
    .string()
    .trim()
    .optional()
    .nullable(),
});

/* =========================================================
   PARENT REGISTRATION
========================================================= */

router.post(
  "/register/parent",
  async (req, res) => {
    try {
      const parsed =
        parentRegisterSchema.safeParse(
          req.body
        );

      if (!parsed.success) {
        return res.status(400).json({
          message:
            parsed.error.issues[0]
              ?.message ||
            "Invalid registration details",
        });
      }

      const {
        name,
        password,
        phone,
      } = parsed.data;

      const email =
        parsed.data.email
          .trim()
          .toLowerCase();

      const existingUser =
        await prisma.user.findUnique({
          where: {
            email,
          },
        });

      if (existingUser) {
        return res
          .status(409)
          .json({
            message:
              "An account with this email already exists",
          });
      }

      const passwordHash =
        await argon2.hash(
          password
        );

      const user =
        await prisma.user.create({
          data: {
            name,
            email,
            passwordHash,
            role: "PARENT",

            parentProfile: {
              create: {
                phone:
                  phone?.trim() ||
                  null,
              },
            },
          },

          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        });

      const token =
        createToken({
          userId: user.id,
          role: user.role,
        });

      res.cookie(
        "ktn_token",
        token,
        {
          httpOnly: true,

          secure:
            process.env
              .NODE_ENV ===
            "production",

          sameSite: "lax",

          maxAge:
            8 *
            60 *
            60 *
            1000,
        }
      );

      return res
        .status(201)
        .json({
          message:
            "Parent account created successfully",

          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          },
        });
    } catch (error) {
      console.error(
        "Parent registration error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Unable to create parent account",
        });
    }
  }
);

/* =========================================================
   LOGIN
========================================================= */

router.post(
  "/login",
  async (req, res) => {
    try {
      const parsed =
        loginSchema.safeParse(
          req.body
        );

      if (!parsed.success) {
        return res
          .status(400)
          .json({
            message:
              "Please enter a valid email and password",
          });
      }

      const email =
        parsed.data.email
          .trim()
          .toLowerCase();

      const user =
        await prisma.user.findUnique({
          where: {
            email,
          },
        });

      if (
        !user ||
        !user.isActive
      ) {
        return res
          .status(401)
          .json({
            message:
              "Invalid email or password",
          });
      }

      const passwordOk =
        await argon2.verify(
          user.passwordHash,
          parsed.data.password
        );

      if (!passwordOk) {
        return res
          .status(401)
          .json({
            message:
              "Invalid email or password",
          });
      }

      const token =
        createToken({
          userId: user.id,
          role: user.role,
        });

      res.cookie(
        "ktn_token",
        token,
        {
          httpOnly: true,

          secure:
            process.env
              .NODE_ENV ===
            "production",

          sameSite: "lax",

          maxAge:
            8 *
            60 *
            60 *
            1000,
        }
      );

      return res.json({
        message:
          "Login successful",

        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Unable to login",
        });
    }
  }
);

/* =========================================================
   CURRENT LOGGED-IN USER
========================================================= */

router.get(
  "/me",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const user =
        await prisma.user.findUnique({
          where: {
            id:
              req.auth!.userId,
          },

          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,
          },
        });

      if (
        !user ||
        !user.isActive
      ) {
        res.clearCookie(
          "ktn_token",
          {
            httpOnly: true,

            secure:
              process.env
                .NODE_ENV ===
              "production",

            sameSite:
              "lax",
          }
        );

        return res
          .status(401)
          .json({
            message:
              "User not available",
          });
      }

      return res.json({
        user: {
          id: user.id,
          name: user.name,
          email:
            user.email,
          role:
            user.role,
        },
      });
    } catch (error) {
      console.error(
        "Get current user error:",
        error
      );

      return res
        .status(500)
        .json({
          message:
            "Unable to get current user",
        });
    }
  }
);

/* =========================================================
   LOGOUT
========================================================= */

router.post(
  "/logout",
  (_req, res) => {
    res.clearCookie(
      "ktn_token",
      {
        httpOnly: true,

        secure:
          process.env
            .NODE_ENV ===
          "production",

        sameSite:
          "lax",
      }
    );

    return res.json({
      message:
        "Logged out successfully",
    });
  }
);

export default router;