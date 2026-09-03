import { Router } from "express";

import argon2 from "argon2";

import { z } from "zod";

import { prisma } from "../lib/prisma";

import {
  requireAuth,
  requireRole,
  type AuthenticatedRequest,
} from "../middleware/auth";

const router = Router();

/* =========================================================
   VALIDATION
========================================================= */

const schoolSettingsSchema = z.object({
  schoolName: z
    .string()
    .trim()
    .min(2, "School name is required"),

  shortName: z
    .string()
    .trim()
    .optional()
    .nullable(),

  address: z
    .string()
    .trim()
    .optional()
    .nullable(),

  phone: z
    .string()
    .trim()
    .optional()
    .nullable(),

  email: z
    .string()
    .trim()
    .email("Please enter a valid email")
    .optional()
    .nullable()
    .or(z.literal("")),

  website: z
    .string()
    .trim()
    .url("Please enter a valid website URL")
    .optional()
    .nullable()
    .or(z.literal("")),

  administratorName: z
    .string()
    .trim()
    .optional()
    .nullable(),

  logoUrl: z
    .string()
    .trim()
    .optional()
    .nullable(),

  timezone: z
    .string()
    .trim()
    .min(1, "Timezone is required"),

  language: z
    .string()
    .trim()
    .min(1, "Language is required"),

  admissionOpen: z.boolean(),
});

const profileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name is required"),

  phone: z
    .string()
    .trim()
    .optional()
    .nullable(),
});

const passwordSchema = z.object({
  currentPassword: z
    .string()
    .min(
      1,
      "Current password is required"
    ),

  newPassword: z
    .string()
    .min(
      8,
      "New password must be at least 8 characters"
    ),
});

const deleteAccountSchema =
  z.object({
    password: z
      .string()
      .min(
        1,
        "Password is required"
      ),
  });

/* =========================================================
   GET SCHOOL SETTINGS

   Admin only.
========================================================= */

router.get(
  "/school",
  requireAuth,
  requireRole("ADMIN"),
  async (_req, res) => {
    try {
      const settings =
        await prisma.schoolSetting.findFirst({
          orderBy: {
            id: "asc",
          },
        });

      if (!settings) {
        return res.status(404).json({
          message:
            "School settings have not been configured",
        });
      }

      return res.json({
        settings,
      });
    } catch (error) {
      console.error(
        "Get school settings error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to get school settings",
      });
    }
  }
);

/* =========================================================
   GET PUBLIC ADMISSION STATUS

   Public endpoint.

   Used by the public Apply page to check whether
   KTN Digital School is currently accepting
   admission applications.

   Only admissionOpen is exposed.
========================================================= */

router.get(
  "/admission-status",
  async (_req, res) => {
    try {
      const settings =
        await prisma.schoolSetting.findFirst({
          orderBy: {
            id: "asc",
          },

          select: {
            admissionOpen: true,
          },
        });

      return res.json({
        admissionOpen:
          settings?.admissionOpen ??
          true,
      });
    } catch (error) {
      console.error(
        "GET admission status error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load admission status.",
      });
    }
  }
);

/* =========================================================
   UPDATE SCHOOL SETTINGS

   Admin only.
========================================================= */

router.put(
  "/school",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      const parsed =
        schoolSettingsSchema.safeParse(
          req.body
        );

      if (!parsed.success) {
        return res.status(400).json({
          message:
            parsed.error.issues[0]
              ?.message ||
            "Invalid school settings",
        });
      }

      const existing =
        await prisma.schoolSetting.findFirst({
          orderBy: {
            id: "asc",
          },
        });

      if (!existing) {
        return res.status(404).json({
          message:
            "School settings have not been configured",
        });
      }

      const data = parsed.data;

      const settings =
        await prisma.schoolSetting.update({
          where: {
            id: existing.id,
          },

          data: {
            schoolName:
              data.schoolName,

            shortName:
              data.shortName ||
              null,

            address:
              data.address ||
              null,

            phone:
              data.phone ||
              null,

            email:
              data.email ||
              null,

            website:
              data.website ||
              null,

            administratorName:
              data.administratorName ||
              null,

            logoUrl:
              data.logoUrl ||
              null,

            timezone:
              data.timezone,

            language:
              data.language,

            admissionOpen:
              data.admissionOpen,
          },
        });

      return res.json({
        message:
          "School settings updated successfully",

        settings,
      });
    } catch (error) {
      console.error(
        "Update school settings error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to update school settings",
      });
    }
  }
);

/* =========================================================
   GET CURRENT USER PROFILE

   Admin / Teacher / Parent
========================================================= */

router.get(
  "/profile",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const user =
        await prisma.user.findUnique({
          where: {
            id: req.auth!.userId,
          },

          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            isActive: true,

            parentProfile: {
              select: {
                phone: true,
              },
            },
          },
        });

      if (
        !user ||
        !user.isActive
      ) {
        return res.status(404).json({
          message:
            "User account not found",
        });
      }

      return res.json({
        profile: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,

          phone:
            user.parentProfile
              ?.phone ||
            null,
        },
      });
    } catch (error) {
      console.error(
        "Get profile error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to get profile",
      });
    }
  }
);

/* =========================================================
   UPDATE CURRENT USER PROFILE

   Parent phone is stored in ParentProfile.
   Admin/Teacher currently update name only.
========================================================= */

router.put(
  "/profile",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const parsed =
        profileSchema.safeParse(
          req.body
        );

      if (!parsed.success) {
        return res.status(400).json({
          message:
            parsed.error.issues[0]
              ?.message ||
            "Invalid profile details",
        });
      }

      const user =
        await prisma.user.findUnique({
          where: {
            id: req.auth!.userId,
          },

          select: {
            id: true,
            role: true,
            isActive: true,
          },
        });

      if (
        !user ||
        !user.isActive
      ) {
        return res.status(404).json({
          message:
            "User account not found",
        });
      }

      await prisma.user.update({
        where: {
          id: user.id,
        },

        data: {
          name:
            parsed.data.name,
        },
      });

      if (
        user.role ===
        "PARENT"
      ) {
        await prisma.parentProfile.update({
          where: {
            userId:
              user.id,
          },

          data: {
            phone:
              parsed.data.phone ||
              null,
          },
        });
      }

      return res.json({
        message:
          "Profile updated successfully",
      });
    } catch (error) {
      console.error(
        "Update profile error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to update profile",
      });
    }
  }
);

/* =========================================================
   CHANGE PASSWORD

   Admin / Teacher / Parent
========================================================= */

router.put(
  "/password",
  requireAuth,
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const parsed =
        passwordSchema.safeParse(
          req.body
        );

      if (!parsed.success) {
        return res.status(400).json({
          message:
            parsed.error.issues[0]
              ?.message ||
            "Invalid password details",
        });
      }

      const user =
        await prisma.user.findUnique({
          where: {
            id:
              req.auth!.userId,
          },
        });

      if (
        !user ||
        !user.isActive
      ) {
        return res.status(404).json({
          message:
            "User account not found",
        });
      }

      const passwordOk =
        await argon2.verify(
          user.passwordHash,
          parsed.data
            .currentPassword
        );

      if (!passwordOk) {
        return res.status(400).json({
          message:
            "Current password is incorrect",
        });
      }

      const samePassword =
        await argon2.verify(
          user.passwordHash,
          parsed.data.newPassword
        );

      if (samePassword) {
        return res.status(400).json({
          message:
            "New password must be different from the current password",
        });
      }

      const passwordHash =
        await argon2.hash(
          parsed.data.newPassword
        );

      await prisma.user.update({
        where: {
          id: user.id,
        },

        data: {
          passwordHash,
        },
      });

      return res.json({
        message:
          "Password changed successfully",
      });
    } catch (error) {
      console.error(
        "Change password error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to change password",
      });
    }
  }
);

/* =========================================================
   DEACTIVATE OWN ACCOUNT

   PARENT ONLY

   Important:
   This does NOT delete:
   - StudentProfile
   - AdmissionApplication
   - Enrollment
   - Attendance
   - Exam results

   It disables the parent's login account.
========================================================= */

router.delete(
  "/account",
  requireAuth,
  requireRole("PARENT"),
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const parsed =
        deleteAccountSchema.safeParse(
          req.body
        );

      if (!parsed.success) {
        return res.status(400).json({
          message:
            "Password is required",
        });
      }

      const user =
        await prisma.user.findUnique({
          where: {
            id:
              req.auth!.userId,
          },
        });

      if (
        !user ||
        !user.isActive
      ) {
        return res.status(404).json({
          message:
            "User account not found",
        });
      }

      const passwordOk =
        await argon2.verify(
          user.passwordHash,
          parsed.data.password
        );

      if (!passwordOk) {
        return res.status(400).json({
          message:
            "Password is incorrect",
        });
      }

      await prisma.user.update({
        where: {
          id: user.id,
        },

        data: {
          isActive: false,
        },
      });

      res.clearCookie(
        "ktn_token",
        {
          httpOnly: true,

          secure:
            process.env
              .NODE_ENV ===
            "production",

          sameSite: "lax",
        }
      );

      return res.json({
        message:
          "Your account has been deactivated successfully",
      });
    } catch (error) {
      console.error(
        "Deactivate account error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to deactivate account",
      });
    }
  }
);

export default router;