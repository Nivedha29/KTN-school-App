import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth, requireRole } from "../middleware/auth";

const router = Router();

/*
=========================================================
HELPERS
=========================================================
*/

function parseOptionalDate(value: unknown) {
  if (!value) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const parsedDate = new Date(`${value}T00:00:00.000Z`);

  if (Number.isNaN(parsedDate.getTime())) {
    return undefined;
  }

  return parsedDate;
}

/*
=========================================================
ADMIN ROUTES
=========================================================
*/

// Get all notices
router.get(
  "/admin",
  requireAuth,
  requireRole("ADMIN"),
  async (_req, res) => {
    try {
      const notices = await prisma.notice.findMany({
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.json({
        notices,
      });
    } catch (error) {
      console.error("GET ADMIN NOTICES ERROR:", error);

      return res.status(500).json({
        message: "Failed to load notices.",
      });
    }
  }
);

// Create notice
router.post(
  "/admin",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      const {
        title,
        message,
        expiresAt,
      } = req.body;

      if (!title?.trim() || !message?.trim()) {
        return res.status(400).json({
          message: "Title and message are required.",
        });
      }

      const parsedExpiresAt = parseOptionalDate(expiresAt);

      if (parsedExpiresAt === undefined) {
        return res.status(400).json({
          message: "Invalid expiry date.",
        });
      }

      const notice = await prisma.notice.create({
        data: {
          title: title.trim(),
          message: message.trim(),
          expiresAt: parsedExpiresAt,
          createdById: req.auth!.userId,
          isActive: true,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return res.status(201).json({
        message: "Notice created successfully.",
        notice,
      });
    } catch (error) {
      console.error("CREATE NOTICE ERROR:", error);

      return res.status(500).json({
        message: "Failed to create notice.",
      });
    }
  }
);

// Update notice
router.put(
  "/admin/:noticeId",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      const noticeId = Number(req.params.noticeId);

      if (!Number.isInteger(noticeId)) {
        return res.status(400).json({
          message: "Invalid notice ID.",
        });
      }

      const existingNotice = await prisma.notice.findUnique({
        where: {
          id: noticeId,
        },
      });

      if (!existingNotice) {
        return res.status(404).json({
          message: "Notice not found.",
        });
      }

      const {
        title,
        message,
        expiresAt,
        isActive,
      } = req.body;

      const nextTitle =
        typeof title === "string"
          ? title.trim()
          : existingNotice.title;

      const nextMessage =
        typeof message === "string"
          ? message.trim()
          : existingNotice.message;

      if (!nextTitle || !nextMessage) {
        return res.status(400).json({
          message: "Title and message cannot be empty.",
        });
      }

      const parsedExpiresAt =
        expiresAt === undefined
          ? existingNotice.expiresAt
          : parseOptionalDate(expiresAt);

      if (parsedExpiresAt === undefined) {
        return res.status(400).json({
          message: "Invalid expiry date.",
        });
      }

      const updatedNotice = await prisma.notice.update({
        where: {
          id: noticeId,
        },
        data: {
          title: nextTitle,
          message: nextMessage,
          expiresAt: parsedExpiresAt,
          isActive:
            typeof isActive === "boolean"
              ? isActive
              : existingNotice.isActive,
        },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
        },
      });

      return res.json({
        message: "Notice updated successfully.",
        notice: updatedNotice,
      });
    } catch (error) {
      console.error("UPDATE NOTICE ERROR:", error);

      return res.status(500).json({
        message: "Failed to update notice.",
      });
    }
  }
);

// Soft delete notice
router.delete(
  "/admin/:noticeId",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      const noticeId = Number(req.params.noticeId);

      if (!Number.isInteger(noticeId)) {
        return res.status(400).json({
          message: "Invalid notice ID.",
        });
      }

      const notice = await prisma.notice.findUnique({
        where: {
          id: noticeId,
        },
      });

      if (!notice) {
        return res.status(404).json({
          message: "Notice not found.",
        });
      }

      await prisma.notice.update({
        where: {
          id: noticeId,
        },
        data: {
          isActive: false,
        },
      });

      return res.json({
        message: "Notice removed successfully.",
      });
    } catch (error) {
      console.error("DELETE NOTICE ERROR:", error);

      return res.status(500).json({
        message: "Failed to remove notice.",
      });
    }
  }
);

/*
=========================================================
SHARED NOTICE ROUTE
Teacher / Student / Parent
=========================================================
*/

router.get(
  "/",
  requireAuth,
  requireRole("TEACHER", "PARENT"),
  async (_req, res) => {
    try {
      const today = new Date();

      today.setUTCHours(0, 0, 0, 0);

      const notices = await prisma.notice.findMany({
        where: {
          isActive: true,
          OR: [
            {
              expiresAt: null,
            },
            {
              expiresAt: {
                gte: today,
              },
            },
          ],
        },
        include: {
          createdBy: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.json({
        notices,
      });
    } catch (error) {
      console.error("GET ACTIVE NOTICES ERROR:", error);

      return res.status(500).json({
        message: "Failed to load notices.",
      });
    }
  }
);

export default router;