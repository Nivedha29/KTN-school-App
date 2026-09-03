import { Router } from "express";
import { z } from "zod";

import { prisma } from "../lib/prisma";

import {
  requireAuth,
  requireRole,
  type AuthenticatedRequest,
} from "../middleware/auth";

const router = Router();

/* ========================================
   VALIDATION
======================================== */

const childSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Child name is required"),

  admissionNumber: z
    .string()
    .trim()
    .optional()
    .nullable(),

  dateOfBirth: z
    .string()
    .optional()
    .nullable(),

  gender: z
    .string()
    .trim()
    .optional()
    .nullable(),

  schoolName: z
    .string()
    .trim()
    .optional()
    .nullable(),

  schoolGrade: z
    .string()
    .trim()
    .optional()
    .nullable(),

  relationship: z
    .string()
    .trim()
    .optional()
    .default("Parent"),
});

/* ========================================
   HELPER
======================================== */

async function getParentProfile(
  userId: number
) {
  return prisma.parentProfile.findUnique({
    where: {
      userId,
    },
  });
}

/* ========================================
   GET MY CHILDREN

   GET /api/parents/me/children
======================================== */

router.get(
  "/me/children",

  requireAuth,
  requireRole("PARENT"),

  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const userId =
        req.auth!.userId;

      const parent =
        await getParentProfile(
          userId
        );

      if (!parent) {
        return res.status(404).json({
          message:
            "Parent profile not found.",
        });
      }

      const links =
        await prisma.parentStudent.findMany({
          where: {
            parentId:
              parent.id,

            student: {
              isActive: true,
            },
          },

          include: {
            student: {
              include: {
                enrollments: {
                  where: {
                    isActive: true,
                  },

                  include: {
                    grade: {
                      include: {
                        academicYear:
                          true,
                      },
                    },
                  },

                  orderBy: {
                    createdAt:
                      "desc",
                  },
                },

                admissionApplications:
                  {
                    where: {
                      parentId:
                        parent.id,
                    },

                    orderBy: {
                      submittedAt:
                        "desc",
                    },

                    take: 1,
                  },
              },
            },
          },

          orderBy: {
            createdAt: "desc",
          },
        });

      const children =
        links.map((link) => {
          const latestApplication =
            link.student
              .admissionApplications[0] ||
            null;

          return {
            id: link.id,

            relationship:
              link.relationship ||
              "Parent",

            admissionStatus:
              latestApplication?.status ||
              null,

            admissionApplication:
              latestApplication,

            student: {
              ...link.student,

              admissionApplications:
                undefined,
            },
          };
        });

      return res.json(
        children
      );
    } catch (error) {
      console.error(
        "GET parent children error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load children.",
      });
    }
  }
);

/* ========================================
   ADD CHILD + SUBMIT ADMISSION REQUEST

   POST /api/parents/me/children
======================================== */

router.post(
  "/me/children",

  requireAuth,
  requireRole("PARENT"),

  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      /*
       * ------------------------------------
       * 1. CHECK WHETHER ADMISSIONS ARE OPEN
       * ------------------------------------
       */

      const schoolSetting =
        await prisma.schoolSetting.findFirst({
          orderBy: {
            id: "asc",
          },

          select: {
            admissionOpen: true,
          },
        });

      /*
       * If SchoolSetting has not been
       * created yet, admissions remain
       * available by default.
       */

      if (
        schoolSetting &&
        !schoolSetting.admissionOpen
      ) {
        return res.status(403).json({
          message:
            "Admissions are currently closed. Please contact KTN Digital School for further information.",
        });
      }

      /*
       * ------------------------------------
       * 2. VALIDATE CHILD INFORMATION
       * ------------------------------------
       */

      const parsed =
        childSchema.safeParse(
          req.body
        );

      if (!parsed.success) {
        return res.status(400).json({
          message:
            parsed.error.issues[0]
              ?.message ||
            "Invalid child information.",
        });
      }

      /*
       * ------------------------------------
       * 3. FIND PARENT
       * ------------------------------------
       */

      const userId =
        req.auth!.userId;

      const parent =
        await getParentProfile(
          userId
        );

      if (!parent) {
        return res.status(404).json({
          message:
            "Parent profile not found.",
        });
      }

      const {
        name,
        admissionNumber,
        dateOfBirth,
        gender,
        schoolName,
        schoolGrade,
        relationship,
      } = parsed.data;

      const normalizedAdmissionNumber =
        admissionNumber?.trim() ||
        null;

      const normalizedGender =
        gender?.trim() ||
        null;

      const normalizedSchoolName =
        schoolName?.trim() ||
        null;

      const normalizedSchoolGrade =
        schoolGrade?.trim() ||
        null;

      const normalizedRelationship =
        relationship?.trim() ||
        "Parent";

      /*
       * ------------------------------------
       * 4. CHECK ADMISSION NUMBER
       * ------------------------------------
       */

      if (
        normalizedAdmissionNumber
      ) {
        const existingStudent =
          await prisma.studentProfile.findUnique({
            where: {
              admissionNumber:
                normalizedAdmissionNumber,
            },
          });

        if (existingStudent) {
          return res.status(409).json({
            message:
              "This admission number is already registered.",
          });
        }
      }

      /*
       * ------------------------------------
       * 5. VALIDATE DATE OF BIRTH
       * ------------------------------------
       */

      let parsedDateOfBirth:
        | Date
        | null = null;

      if (dateOfBirth) {
        parsedDateOfBirth =
          new Date(
            `${dateOfBirth}T00:00:00.000Z`
          );

        if (
          Number.isNaN(
            parsedDateOfBirth.getTime()
          )
        ) {
          return res.status(400).json({
            message:
              "Invalid date of birth.",
          });
        }
      }

      /*
       * ------------------------------------
       * 6. CREATE ADMISSION REQUEST
       * ------------------------------------
       */

      const result =
        await prisma.$transaction(
          async (tx) => {
            /*
             * Create StudentProfile only.
             *
             * IMPORTANT:
             * Student does NOT have:
             *
             * - User account
             * - Email
             * - Password
             * - Login access
             * - KTN grade yet
             */

            const student =
              await tx.studentProfile.create({
                data: {
                  name:
                    name.trim(),

                  admissionNumber:
                    normalizedAdmissionNumber,

                  dateOfBirth:
                    parsedDateOfBirth,

                  gender:
                    normalizedGender,

                  schoolName:
                    normalizedSchoolName,

                  schoolGrade:
                    normalizedSchoolGrade,

                  isActive: true,
                },
              });

            /*
             * Link child to parent.
             */

            const parentLink =
              await tx.parentStudent.create({
                data: {
                  parentId:
                    parent.id,

                  studentId:
                    student.id,

                  relationship:
                    normalizedRelationship,
                },
              });

            /*
             * Create PENDING
             * admission application.
             */

            const application =
              await tx.admissionApplication.create({
                data: {
                  studentId:
                    student.id,

                  parentId:
                    parent.id,

                  status:
                    "PENDING",
                },
              });

            /*
             * IMPORTANT:
             *
             * Enrollment is NOT created
             * here.
             *
             * Parent does not select the
             * official KTN grade.
             *
             * Admin reviews the application
             * and assigns the KTN grade when
             * approving the admission.
             */

            return {
              student,
              parentLink,
              application,
            };
          }
        );

      return res
        .status(201)
        .json({
          message:
            "Admission request submitted successfully.",

          relationship:
            result.parentLink
              .relationship,

          admissionStatus:
            result.application
              .status,

          admissionApplication:
            result.application,

          student:
            result.student,
        });
    } catch (error) {
      console.error(
        "POST parent child error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to submit admission request.",
      });
    }
  }
);

export default router;