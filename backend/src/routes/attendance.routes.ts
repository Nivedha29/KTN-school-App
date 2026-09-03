import { Router } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma";
import {
  requireAuth,
  requireRole,
  AuthenticatedRequest,
} from "../middleware/auth";

const router = Router();

const attendanceRecordSchema = z.object({
  studentId: z.number().int().positive(),

  status: z.enum([
    "PRESENT",
    "ABSENT",
    "LATE",
    "EXCUSED",
  ]),

  note: z.string().trim().optional(),
});

const saveAttendanceSchema = z.object({
  timetableEntryId:
    z.number().int().positive(),

  attendanceDate:
    z.string().min(1),

  records:
    z.array(attendanceRecordSchema),
});

/* ========================================
   HELPERS
======================================== */

function normalizeAttendanceDate(
  value: string
) {
  const date = new Date(
    `${value}T00:00:00.000Z`
  );

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

/* ========================================
   TEACHER - GET TIMETABLE
   GET /api/attendance/my-classes
======================================== */

router.get(
  "/my-classes",
  requireAuth,
  requireRole("TEACHER"),
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const userId =
        req.auth!.userId;

      const teacher =
        await prisma.teacherProfile.findUnique({
          where: {
            userId,
          },

          select: {
            id: true,
          },
        });

      if (!teacher) {
        return res.status(404).json({
          message:
            "Teacher profile not found.",
        });
      }

      const classes =
        await prisma.timetableEntry.findMany({
          where: {
            teacherId: teacher.id,
            isActive: true,

            grade: {
              academicYear: {
                isActive: true,
              },
            },
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
          },

          orderBy: [
            {
              dayOfWeek: "asc",
            },
            {
              startTime: "asc",
            },
          ],
        });

      return res.json({
        classes,
      });
    } catch (error) {
      console.error(
        "Get teacher classes error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load teacher classes.",
      });
    }
  }
);

/* ========================================
   TEACHER - STUDENTS FOR CLASS

   GET
   /api/attendance/class/:timetableEntryId/students
======================================== */

router.get(
  "/class/:timetableEntryId/students",
  requireAuth,
  requireRole("TEACHER"),
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const timetableEntryId =
        Number(
          req.params.timetableEntryId
        );

      if (
        !Number.isInteger(
          timetableEntryId
        ) ||
        timetableEntryId <= 0
      ) {
        return res.status(400).json({
          message:
            "Invalid timetable entry ID.",
        });
      }

      const teacher =
        await prisma.teacherProfile.findUnique({
          where: {
            userId:
              req.auth!.userId,
          },

          select: {
            id: true,
          },
        });

      if (!teacher) {
        return res.status(404).json({
          message:
            "Teacher profile not found.",
        });
      }

      const timetableEntry =
        await prisma.timetableEntry.findFirst({
          where: {
            id:
              timetableEntryId,

            teacherId:
              teacher.id,

            isActive:
              true,
          },

          select: {
            id: true,

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

            dayOfWeek: true,
            startTime: true,
            endTime: true,
          },
        });

      if (!timetableEntry) {
        return res.status(404).json({
          message:
            "Class was not found or is not assigned to you.",
        });
      }

      /*
       * Students are now StudentProfile
       * records directly.
       *
       * No student User account is needed.
       */

      const students =
        await prisma.studentProfile.findMany({
          where: {
            isActive: true,

            enrollments: {
              some: {
                gradeId:
                  timetableEntry.grade.id,

                isActive: true,
              },
            },
          },

          select: {
            id: true,
            name: true,
            admissionNumber: true,
            dateOfBirth: true,
            gender: true,
          },

          orderBy: {
            name: "asc",
          },
        });

      return res.json({
        class: timetableEntry,
        students,
      });
    } catch (error) {
      console.error(
        "Get attendance students error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load students for attendance.",
      });
    }
  }
);

/* ========================================
   TEACHER - GET ATTENDANCE FOR DATE

   GET
   /api/attendance/class/:id/date/:date
======================================== */

router.get(
  "/class/:timetableEntryId/date/:date",
  requireAuth,
  requireRole("TEACHER"),
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const timetableEntryId =
        Number(
          req.params.timetableEntryId
        );

      const attendanceDate =
        typeof req.params.date ===
        "string"
          ? normalizeAttendanceDate(
              req.params.date
            )
          : null;

      if (
        !Number.isInteger(
          timetableEntryId
        ) ||
        timetableEntryId <= 0 ||
        !attendanceDate
      ) {
        return res.status(400).json({
          message:
            "Invalid class ID or attendance date.",
        });
      }

      const teacher =
        await prisma.teacherProfile.findUnique({
          where: {
            userId:
              req.auth!.userId,
          },

          select: {
            id: true,
          },
        });

      if (!teacher) {
        return res.status(404).json({
          message:
            "Teacher profile not found.",
        });
      }

      const timetableEntry =
        await prisma.timetableEntry.findFirst({
          where: {
            id:
              timetableEntryId,

            teacherId:
              teacher.id,

            isActive:
              true,
          },

          select: {
            id: true,
          },
        });

      if (!timetableEntry) {
        return res.status(403).json({
          message:
            "You are not allowed to manage attendance for this class.",
        });
      }

      const session =
        await prisma.attendanceSession.findUnique({
          where: {
            timetableEntryId_attendanceDate:
              {
                timetableEntryId,
                attendanceDate,
              },
          },

          include: {
            records: {
              select: {
                id: true,
                studentId: true,
                status: true,
                note: true,
              },
            },
          },
        });

      return res.json({
        session,
      });
    } catch (error) {
      console.error(
        "Get attendance session error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load attendance.",
      });
    }
  }
);

/* ========================================
   TEACHER - SAVE ATTENDANCE
   POST /api/attendance
======================================== */

router.post(
  "/",
  requireAuth,
  requireRole("TEACHER"),
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const parsed =
        saveAttendanceSchema.safeParse(
          req.body
        );

      if (!parsed.success) {
        return res.status(400).json({
          message:
            "Please check the attendance information.",

          errors:
            parsed.error.flatten(),
        });
      }

      const {
        timetableEntryId,
        attendanceDate:
          dateValue,
        records,
      } = parsed.data;

      const attendanceDate =
        normalizeAttendanceDate(
          dateValue
        );

      if (!attendanceDate) {
        return res.status(400).json({
          message:
            "Invalid attendance date.",
        });
      }

      const teacher =
        await prisma.teacherProfile.findUnique({
          where: {
            userId:
              req.auth!.userId,
          },

          select: {
            id: true,

            user: {
              select: {
                name: true,
              },
            },
          },
        });

      if (!teacher) {
        return res.status(404).json({
          message:
            "Teacher profile not found.",
        });
      }

      const timetableEntry =
        await prisma.timetableEntry.findFirst({
          where: {
            id:
              timetableEntryId,

            teacherId:
              teacher.id,

            isActive:
              true,
          },

          select: {
            id: true,
            gradeId: true,

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
        });

      if (!timetableEntry) {
        return res.status(403).json({
          message:
            "You are not allowed to take attendance for this class.",
        });
      }

      /* ====================================
         VERIFY STUDENTS
      ==================================== */

      const uniqueStudentIds = [
        ...new Set(
          records.map(
            (record) =>
              record.studentId
          )
        ),
      ];

      if (
        uniqueStudentIds.length !==
        records.length
      ) {
        return res.status(400).json({
          message:
            "Duplicate students were found in the attendance list.",
        });
      }

      /*
       * Validate directly against
       * StudentProfile.isActive.
       */

      const validStudents =
        await prisma.studentProfile.findMany({
          where: {
            id: {
              in:
                uniqueStudentIds,
            },

            isActive: true,

            enrollments: {
              some: {
                gradeId:
                  timetableEntry.gradeId,

                isActive: true,
              },
            },
          },

          select: {
            id: true,
          },
        });

      if (
        validStudents.length !==
        uniqueStudentIds.length
      ) {
        return res.status(400).json({
          message:
            "One or more students do not belong to this grade.",
        });
      }

      /* ====================================
         SAVE ATTENDANCE
      ==================================== */

      const session =
        await prisma.$transaction(
          async (tx) => {
            const attendanceSession =
              await tx.attendanceSession.upsert({
                where: {
                  timetableEntryId_attendanceDate:
                    {
                      timetableEntryId,
                      attendanceDate,
                    },
                },

                update: {
                  markedByUserId:
                    req.auth!.userId,
                },

                create: {
                  timetableEntryId,
                  attendanceDate,

                  markedByUserId:
                    req.auth!.userId,
                },
              });

            for (
              const record of records
            ) {
              await tx.attendanceRecord.upsert({
                where: {
                  attendanceSessionId_studentId:
                    {
                      attendanceSessionId:
                        attendanceSession.id,

                      studentId:
                        record.studentId,
                    },
                },

                update: {
                  status:
                    record.status,

                  note:
                    record.note &&
                    record.note.length >
                      0
                      ? record.note
                      : null,
                },

                create: {
                  attendanceSessionId:
                    attendanceSession.id,

                  studentId:
                    record.studentId,

                  status:
                    record.status,

                  note:
                    record.note &&
                    record.note.length >
                      0
                      ? record.note
                      : null,
                },
              });
            }

            return tx.attendanceSession.findUnique({
              where: {
                id:
                  attendanceSession.id,
              },

              include: {
                records: {
                  select: {
                    id: true,
                    studentId: true,
                    status: true,
                    note: true,
                  },
                },
              },
            });
          }
        );

      return res.json({
        message:
          "Attendance saved successfully.",

        session,
      });
    } catch (error) {
      console.error(
        "Save attendance error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to save attendance.",
      });
    }
  }
);

/* ========================================
   ADMIN - ATTENDANCE OVERVIEW

   GET /api/attendance/admin/overview

   Optional:
   ?date=2026-08-31
   ?gradeId=3
======================================== */

router.get(
  "/admin/overview",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      const dateValue =
        typeof req.query.date ===
        "string"
          ? req.query.date
          : "";

      const gradeIdValue =
        typeof req.query.gradeId ===
        "string"
          ? req.query.gradeId
          : "";

      let attendanceDate:
        | Date
        | undefined;

      if (dateValue) {
        const normalized =
          normalizeAttendanceDate(
            dateValue
          );

        if (!normalized) {
          return res.status(400).json({
            message:
              "Invalid attendance date.",
          });
        }

        attendanceDate =
          normalized;
      }

      let gradeId:
        | number
        | undefined;

      if (gradeIdValue) {
        const parsedGradeId =
          Number(
            gradeIdValue
          );

        if (
          !Number.isInteger(
            parsedGradeId
          ) ||
          parsedGradeId <= 0
        ) {
          return res.status(400).json({
            message:
              "Invalid grade ID.",
          });
        }

        gradeId =
          parsedGradeId;
      }

      const sessions =
        await prisma.attendanceSession.findMany({
          where: {
            ...(attendanceDate
              ? {
                  attendanceDate,
                }
              : {}),

            timetableEntry: {
              isActive: true,

              ...(gradeId
                ? {
                    gradeId,
                  }
                : {}),

              grade: {
                academicYear: {
                  isActive: true,
                },
              },
            },
          },

          select: {
            id: true,
            attendanceDate: true,
            createdAt: true,
            updatedAt: true,

            timetableEntry: {
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

                    /*
                     * Teacher still has
                     * a User login account.
                     */

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
            },

            records: {
              select: {
                id: true,
                studentId: true,
                status: true,
                note: true,

                student: {
                  select: {
                    id: true,
                    name: true,
                    admissionNumber: true,
                  },
                },
              },

              orderBy: {
                student: {
                  name: "asc",
                },
              },
            },
          },

          orderBy: [
            {
              attendanceDate:
                "desc",
            },
            {
              id: "desc",
            },
          ],
        });

      const formattedSessions =
        sessions.map(
          (session) => {
            const counts = {
              PRESENT: 0,
              ABSENT: 0,
              LATE: 0,
              EXCUSED: 0,
            };

            session.records.forEach(
              (record) => {
                counts[
                  record.status
                ] += 1;
              }
            );

            return {
              ...session,

              counts,

              totalStudents:
                session.records.length,
            };
          }
        );

      const summary = {
        sessions:
          formattedSessions.length,

        records: 0,

        PRESENT: 0,
        ABSENT: 0,
        LATE: 0,
        EXCUSED: 0,
      };

      formattedSessions.forEach(
        (session) => {
          summary.records +=
            session.totalStudents;

          summary.PRESENT +=
            session.counts.PRESENT;

          summary.ABSENT +=
            session.counts.ABSENT;

          summary.LATE +=
            session.counts.LATE;

          summary.EXCUSED +=
            session.counts.EXCUSED;
        }
      );

      return res.json({
        filters: {
          date:
            dateValue || null,

          gradeId:
            gradeId || null,
        },

        summary,

        sessions:
          formattedSessions,
      });
    } catch (error) {
      console.error(
        "Admin attendance overview error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load attendance overview.",
      });
    }
  }
);

/* ========================================
   ADMIN - SINGLE ATTENDANCE SESSION

   GET
   /api/attendance/admin/session/:sessionId
======================================== */

router.get(
  "/admin/session/:sessionId",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    try {
      const sessionId =
        Number(
          req.params.sessionId
        );

      if (
        !Number.isInteger(
          sessionId
        ) ||
        sessionId <= 0
      ) {
        return res.status(400).json({
          message:
            "Invalid attendance session ID.",
        });
      }

      const session =
        await prisma.attendanceSession.findUnique({
          where: {
            id:
              sessionId,
          },

          select: {
            id: true,
            attendanceDate: true,
            createdAt: true,
            updatedAt: true,

            timetableEntry: {
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
            },

            records: {
              select: {
                id: true,
                status: true,
                note: true,

                student: {
                  select: {
                    id: true,
                    name: true,
                    admissionNumber: true,
                  },
                },
              },

              orderBy: {
                student: {
                  name: "asc",
                },
              },
            },
          },
        });

      if (!session) {
        return res.status(404).json({
          message:
            "Attendance session not found.",
        });
      }

      return res.json({
        session,
      });
    } catch (error) {
      console.error(
        "Admin attendance session error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load attendance session.",
      });
    }
  }
);

/* ========================================
   PARENT - CHILDREN

   GET
   /api/attendance/parent/children
======================================== */

router.get(
  "/parent/children",
  requireAuth,
  requireRole("PARENT"),
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const parent =
        await prisma.parentProfile.findUnique({
          where: {
            userId:
              req.auth!.userId,
          },

          select: {
            id: true,

            studentLinks: {
              select: {
                relationship: true,

                student: {
                  select: {
                    id: true,
                    name: true,
                    admissionNumber: true,
                    isActive: true,

                    enrollments: {
                      where: {
                        isActive: true,
                      },

                      select: {
                        grade: {
                          select: {
                            id: true,
                            name: true,

                            academicYear:
                              {
                                select:
                                  {
                                    id: true,
                                    name: true,
                                    isActive:
                                      true,
                                  },
                              },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });

      if (!parent) {
        return res.status(404).json({
          message:
            "Parent profile not found.",
        });
      }

      const children =
        parent.studentLinks
          .filter(
            (link) =>
              link.student
                .isActive
          )
          .map((link) => ({
            id:
              link.student.id,

            admissionNumber:
              link.student
                .admissionNumber,

            name:
              link.student.name ||
              "Unnamed Student",

            relationship:
              link.relationship ||
              null,

            grade:
              link.student.enrollments.find(
                (enrollment) =>
                  enrollment.grade
                    .academicYear
                    .isActive
              )?.grade || null,
          }));

      return res.json({
        children,
      });
    } catch (error) {
      console.error(
        "Parent children error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load linked children.",
      });
    }
  }
);

/* ========================================
   PARENT - CHILD ATTENDANCE HISTORY

   GET
   /api/attendance/parent/child/:studentId
======================================== */

router.get(
  "/parent/child/:studentId",
  requireAuth,
  requireRole("PARENT"),
  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const studentId =
        Number(
          req.params.studentId
        );

      if (
        !Number.isInteger(
          studentId
        ) ||
        studentId <= 0
      ) {
        return res.status(400).json({
          message:
            "Invalid student ID.",
        });
      }

      const parent =
        await prisma.parentProfile.findUnique({
          where: {
            userId:
              req.auth!.userId,
          },

          select: {
            id: true,
          },
        });

      if (!parent) {
        return res.status(404).json({
          message:
            "Parent profile not found.",
        });
      }

      /*
       * Security:
       * Parent can access only
       * linked children.
       */

      const link =
        await prisma.parentStudent.findUnique({
          where: {
            parentId_studentId: {
              parentId:
                parent.id,

              studentId,
            },
          },

          select: {
            relationship: true,

            student: {
              select: {
                id: true,
                name: true,
                admissionNumber: true,
                isActive: true,

                enrollments: {
                  where: {
                    isActive: true,
                  },

                  select: {
                    grade: {
                      select: {
                        id: true,
                        name: true,

                        academicYear:
                          {
                            select: {
                              id: true,
                              name: true,
                              isActive:
                                true,
                            },
                          },
                      },
                    },
                  },
                },
              },
            },
          },
        });

      if (
        !link ||
        !link.student.isActive
      ) {
        return res.status(403).json({
          message:
            "You are not allowed to view attendance for this student.",
        });
      }

      const records =
        await prisma.attendanceRecord.findMany({
          where: {
            studentId,
          },

          select: {
            id: true,
            status: true,
            note: true,

            attendanceSession: {
              select: {
                id: true,
                attendanceDate: true,

                timetableEntry: {
                  select: {
                    dayOfWeek: true,
                    startTime: true,
                    endTime: true,

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

                        /*
                         * Teacher still has
                         * login User.
                         */

                        user: {
                          select: {
                            name: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },

          orderBy: {
            attendanceSession: {
              attendanceDate:
                "desc",
            },
          },
        });

      const summary = {
        total:
          records.length,

        PRESENT: 0,
        ABSENT: 0,
        LATE: 0,
        EXCUSED: 0,
      };

      records.forEach(
        (record) => {
          summary[
            record.status
          ] += 1;
        }
      );

      /*
       * Present + Late =
       * attended.
       */

      const attended =
        summary.PRESENT +
        summary.LATE;

      const attendanceRate =
        summary.total > 0
          ? Math.round(
              (attended /
                summary.total) *
                100
            )
          : 0;

      const grade =
        link.student.enrollments.find(
          (enrollment) =>
            enrollment.grade
              .academicYear
              .isActive
        )?.grade || null;

      return res.json({
        student: {
          id:
            link.student.id,

          name:
            link.student.name ||
            "Unnamed Student",

          admissionNumber:
            link.student
              .admissionNumber,

          relationship:
            link.relationship ||
            null,

          grade,
        },

        summary: {
          ...summary,
          attendanceRate,
        },

        records,
      });
    } catch (error) {
      console.error(
        "Parent child attendance error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load child attendance.",
      });
    }
  }
);

export default router;