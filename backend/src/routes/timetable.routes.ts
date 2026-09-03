import { Router } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma";
import {
  requireAuth,
  requireRole,
} from "../middleware/auth";

const router = Router();

const timePattern =
  /^([01]\d|2[0-3]):[0-5]\d$/;

const createTimetableSchema = z.object({
  gradeId: z.number().int().positive(),
  subjectId: z.number().int().positive(),
  teacherId: z.number().int().positive(),
  dayOfWeek: z.string().trim().min(1),
  startTime: z.string().regex(timePattern),
  endTime: z.string().regex(timePattern),
  room: z.string().trim().optional(),
});

const updateTimetableSchema =
  createTimetableSchema.partial();

function timeToMinutes(time: string) {
  const [hours, minutes] = time
    .split(":")
    .map(Number);

  return hours * 60 + minutes;
}

function hasOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
) {
  const aStart = timeToMinutes(startA);
  const aEnd = timeToMinutes(endA);

  const bStart = timeToMinutes(startB);
  const bEnd = timeToMinutes(endB);

  return aStart < bEnd && bStart < aEnd;
}

// ========================================
// GET TIMETABLE
// ========================================

router.get(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  async (_req, res) => {
    try {
      const entries =
        await prisma.timetableEntry.findMany({
          where: {
            isActive: true,

            grade: {
              academicYear: {
                isActive: true,
              },
            },
          },

          orderBy: [
            {
              gradeId: "asc",
            },
            {
              dayOfWeek: "asc",
            },
            {
              startTime: "asc",
            },
          ],

          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            room: true,
            isActive: true,

            grade: {
              select: {
                id: true,
                name: true,
              },
            },

            subject: {
              select: {
                id: true,
                name: true,
              },
            },

            teacher: {
              select: {
                id: true,
                employeeNumber: true,

                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        });

      return res.json({
        entries,
      });
    } catch (error) {
      console.error(
        "Get timetable error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load timetable.",
      });
    }
  }
);

// ========================================
// CREATE TIMETABLE ENTRY
// ========================================

router.post(
  "/",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      const parsed =
        createTimetableSchema.safeParse(
          req.body
        );

      if (!parsed.success) {
        return res.status(400).json({
          message:
            "Please check the timetable information.",

          errors:
            parsed.error.flatten(),
        });
      }

      const {
        gradeId,
        subjectId,
        teacherId,
        dayOfWeek,
        startTime,
        endTime,
        room,
      } = parsed.data;

      // ========================================
      // VALIDATE TIME
      // ========================================

      if (
        timeToMinutes(startTime) >=
        timeToMinutes(endTime)
      ) {
        return res.status(400).json({
          message:
            "End time must be later than start time.",
        });
      }

      // ========================================
      // CHECK GRADE
      // ========================================

      const grade =
        await prisma.grade.findFirst({
          where: {
            id: gradeId,

            academicYear: {
              isActive: true,
            },
          },
        });

      if (!grade) {
        return res.status(404).json({
          message:
            "Grade was not found in the active academic year.",
        });
      }

      // ========================================
      // CHECK SUBJECT BELONGS TO GRADE
      // ========================================

      const subject =
        await prisma.subject.findFirst({
          where: {
            id: subjectId,
            gradeId,
          },
        });

      if (!subject) {
        return res.status(400).json({
          message:
            "The selected subject does not belong to this grade.",
        });
      }

      // ========================================
      // CHECK TEACHER
      // ========================================

      const teacher =
        await prisma.teacherProfile.findUnique(
          {
            where: {
              id: teacherId,
            },

            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  isActive: true,
                },
              },
            },
          }
        );

      if (
        !teacher ||
        !teacher.user.isActive
      ) {
        return res.status(404).json({
          message:
            "Teacher was not found or is inactive.",
        });
      }

      // ========================================
      // CHECK SUBJECT ASSIGNMENT
      // ========================================

      const subjectTeacher =
        await prisma.subjectTeacher.findUnique(
          {
            where: {
              subjectId_teacherId: {
                subjectId,
                teacherId,
              },
            },
          }
        );

      if (!subjectTeacher) {
        return res.status(400).json({
          message:
            `${teacher.user.name} is not assigned to ${grade.name} - ${subject.name}.`,
        });
      }

      // ========================================
      // CHECK TIMETABLE CONFLICTS
      // ========================================

      const possibleConflicts =
        await prisma.timetableEntry.findMany({
          where: {
            isActive: true,
            dayOfWeek,

            OR: [
              {
                teacherId,
              },
              {
                gradeId,
              },
            ],
          },

          select: {
            id: true,
            teacherId: true,
            gradeId: true,
            startTime: true,
            endTime: true,

            grade: {
              select: {
                name: true,
              },
            },

            subject: {
              select: {
                name: true,
              },
            },

            teacher: {
              select: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        });

      for (const entry of possibleConflicts) {
        if (
          !hasOverlap(
            startTime,
            endTime,
            entry.startTime,
            entry.endTime
          )
        ) {
          continue;
        }

        if (
          entry.teacherId === teacherId
        ) {
          return res.status(409).json({
            message:
              `${teacher.user.name} already has another class during this time.`,
          });
        }

        if (entry.gradeId === gradeId) {
          return res.status(409).json({
            message:
              `${grade.name} already has another class during this time.`,
          });
        }
      }

      // ========================================
      // CREATE TIMETABLE
      // ========================================

      const entry =
        await prisma.timetableEntry.create({
          data: {
            gradeId,
            subjectId,
            teacherId,
            dayOfWeek,
            startTime,
            endTime,

            room:
              room && room.length > 0
                ? room
                : null,
          },

          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            room: true,

            grade: {
              select: {
                id: true,
                name: true,
              },
            },

            subject: {
              select: {
                id: true,
                name: true,
              },
            },

            teacher: {
              select: {
                id: true,
                employeeNumber: true,

                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        });

      return res.status(201).json({
        message:
          "Timetable entry created successfully.",

        entry,
      });
    } catch (error) {
      console.error(
        "Create timetable error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to create timetable entry.",
      });
    }
  }
);

// ========================================
// UPDATE TIMETABLE ENTRY
// ========================================

router.put(
  "/:entryId",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      const entryId = Number(
        req.params.entryId
      );

      if (!Number.isInteger(entryId)) {
        return res.status(400).json({
          message:
            "Invalid timetable entry ID.",
        });
      }

      const parsed =
        updateTimetableSchema.safeParse(
          req.body
        );

      if (!parsed.success) {
        return res.status(400).json({
          message:
            "Please check the timetable information.",

          errors:
            parsed.error.flatten(),
        });
      }

      // ========================================
      // FIND EXISTING ENTRY
      // ========================================

      const existing =
        await prisma.timetableEntry.findUnique(
          {
            where: {
              id: entryId,
            },
          }
        );

      if (!existing) {
        return res.status(404).json({
          message:
            "Timetable entry not found.",
        });
      }

      // Do not update a timetable entry that
      // has already been deactivated.
      if (!existing.isActive) {
        return res.status(400).json({
          message:
            "Inactive timetable entries cannot be updated.",
        });
      }

      const gradeId =
        parsed.data.gradeId ??
        existing.gradeId;

      const subjectId =
        parsed.data.subjectId ??
        existing.subjectId;

      const teacherId =
        parsed.data.teacherId ??
        existing.teacherId;

      const dayOfWeek =
        parsed.data.dayOfWeek ??
        existing.dayOfWeek;

      const startTime =
        parsed.data.startTime ??
        existing.startTime;

      const endTime =
        parsed.data.endTime ??
        existing.endTime;

      const room =
        parsed.data.room !== undefined
          ? parsed.data.room
          : existing.room;

      // ========================================
      // VALIDATE TIME
      // ========================================

      if (
        timeToMinutes(startTime) >=
        timeToMinutes(endTime)
      ) {
        return res.status(400).json({
          message:
            "End time must be later than start time.",
        });
      }

      // ========================================
      // CHECK GRADE
      // ========================================

      const grade =
        await prisma.grade.findFirst({
          where: {
            id: gradeId,

            academicYear: {
              isActive: true,
            },
          },
        });

      if (!grade) {
        return res.status(404).json({
          message:
            "Grade was not found in the active academic year.",
        });
      }

      // ========================================
      // CHECK SUBJECT
      // ========================================

      const subject =
        await prisma.subject.findFirst({
          where: {
            id: subjectId,
            gradeId,
          },
        });

      if (!subject) {
        return res.status(400).json({
          message:
            "The selected subject does not belong to this grade.",
        });
      }

      // ========================================
      // CHECK TEACHER
      // ========================================

      const teacher =
        await prisma.teacherProfile.findUnique(
          {
            where: {
              id: teacherId,
            },

            include: {
              user: {
                select: {
                  name: true,
                  isActive: true,
                },
              },
            },
          }
        );

      if (
        !teacher ||
        !teacher.user.isActive
      ) {
        return res.status(404).json({
          message:
            "Teacher was not found or is inactive.",
        });
      }

      // ========================================
      // CHECK TEACHER ASSIGNMENT
      // ========================================

      const subjectTeacher =
        await prisma.subjectTeacher.findUnique(
          {
            where: {
              subjectId_teacherId: {
                subjectId,
                teacherId,
              },
            },
          }
        );

      if (!subjectTeacher) {
        return res.status(400).json({
          message:
            `${teacher.user.name} is not assigned to ${grade.name} - ${subject.name}.`,
        });
      }

      // ========================================
      // CHECK CONFLICTS
      // ========================================

      const possibleConflicts =
        await prisma.timetableEntry.findMany({
          where: {
            id: {
              not: entryId,
            },

            isActive: true,
            dayOfWeek,

            OR: [
              {
                teacherId,
              },
              {
                gradeId,
              },
            ],
          },

          select: {
            id: true,
            teacherId: true,
            gradeId: true,
            startTime: true,
            endTime: true,
          },
        });

      for (const entry of possibleConflicts) {
        if (
          !hasOverlap(
            startTime,
            endTime,
            entry.startTime,
            entry.endTime
          )
        ) {
          continue;
        }

        if (
          entry.teacherId === teacherId
        ) {
          return res.status(409).json({
            message:
              `${teacher.user.name} already has another class during this time.`,
          });
        }

        if (entry.gradeId === gradeId) {
          return res.status(409).json({
            message:
              `${grade.name} already has another class during this time.`,
          });
        }
      }

      // ========================================
      // UPDATE TIMETABLE
      // ========================================

      const updated =
        await prisma.timetableEntry.update({
          where: {
            id: entryId,
          },

          data: {
            gradeId,
            subjectId,
            teacherId,
            dayOfWeek,
            startTime,
            endTime,

            room:
              room && room.length > 0
                ? room
                : null,
          },

          select: {
            id: true,
            dayOfWeek: true,
            startTime: true,
            endTime: true,
            room: true,

            grade: {
              select: {
                id: true,
                name: true,
              },
            },

            subject: {
              select: {
                id: true,
                name: true,
              },
            },

            teacher: {
              select: {
                id: true,
                employeeNumber: true,

                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        });

      return res.json({
        message:
          "Timetable entry updated successfully.",

        entry: updated,
      });
    } catch (error) {
      console.error(
        "Update timetable error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to update timetable entry.",
      });
    }
  }
);

// ========================================
// REMOVE / DEACTIVATE TIMETABLE ENTRY
// ========================================
//
// IMPORTANT:
//
// Timetable entries are NOT physically deleted.
//
// AttendanceSession records can reference a
// timetable entry. Therefore removing the
// timetable entry from the database could
// destroy or break historical attendance.
//
// Instead, we set:
//
// isActive = false
//
// The GET timetable API already returns only
// isActive = true entries, so this entry will
// disappear from the active timetable.
//
// ========================================

router.delete(
  "/:entryId",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      const entryId = Number(
        req.params.entryId
      );

      if (!Number.isInteger(entryId)) {
        return res.status(400).json({
          message:
            "Invalid timetable entry ID.",
        });
      }

      // ========================================
      // FIND ENTRY
      // ========================================

      const existing =
        await prisma.timetableEntry.findUnique(
          {
            where: {
              id: entryId,
            },

            select: {
              id: true,
              isActive: true,

              grade: {
                select: {
                  name: true,
                },
              },

              subject: {
                select: {
                  name: true,
                },
              },
            },
          }
        );

      if (!existing) {
        return res.status(404).json({
          message:
            "Timetable entry not found.",
        });
      }

      // ========================================
      // ALREADY INACTIVE
      // ========================================

      if (!existing.isActive) {
        return res.json({
          message:
            "Timetable entry is already inactive.",
        });
      }

      // ========================================
      // SOFT DELETE
      // ========================================

      await prisma.timetableEntry.update({
        where: {
          id: entryId,
        },

        data: {
          isActive: false,
        },
      });

      return res.json({
        message:
          "Timetable entry removed successfully.",
      });
    } catch (error) {
      console.error(
        "Deactivate timetable error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to remove timetable entry.",
      });
    }
  }
);

export default router;