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

const reviewSchema = z.object({
  gradeId: z.number().int().positive().optional(),
  adminNote: z.string().trim().optional().nullable(),
});

/* ========================================
   GET ADMISSION APPLICATIONS
======================================== */

router.get(
  "/admissions",
  requireAuth,
  requireRole("ADMIN"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const applications =
        await prisma.admissionApplication.findMany({
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
                        academicYear: true,
                      },
                    },
                  },
                },
              },
            },

            parent: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },

            reviewedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },

          orderBy: {
            submittedAt: "desc",
          },
        });

      return res.json(applications);
    } catch (error) {
      console.error(
        "GET admission applications error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load admission applications.",
      });
    }
  }
);

/* ========================================
   GET PENDING ADMISSION APPLICATIONS
======================================== */

router.get(
  "/admissions/pending",
  requireAuth,
  requireRole("ADMIN"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const applications =
        await prisma.admissionApplication.findMany({
          where: {
            status: "PENDING",
          },

          include: {
            student: true,

            parent: {
              include: {
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

          orderBy: {
            submittedAt: "asc",
          },
        });

      return res.json(applications);
    } catch (error) {
      console.error(
        "GET pending admissions error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load pending admission applications.",
      });
    }
  }
);

/* ========================================
   APPROVE ADMISSION
======================================== */

router.patch(
  "/admissions/:applicationId/approve",
  requireAuth,
  requireRole("ADMIN"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const applicationId =
        Number(req.params.applicationId);

      if (
        !Number.isInteger(applicationId) ||
        applicationId <= 0
      ) {
        return res.status(400).json({
          message:
            "Invalid admission application ID.",
        });
      }

      const parsed =
        reviewSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          message:
            parsed.error.issues[0]?.message ||
            "Invalid admission review data.",
        });
      }

      const { gradeId, adminNote } =
        parsed.data;

      if (!gradeId) {
        return res.status(400).json({
          message:
            "Please select a KTN class before approving.",
        });
      }

      const adminUserId =
        req.auth!.userId;

      const existingApplication =
        await prisma.admissionApplication.findUnique({
          where: {
            id: applicationId,
          },
          include: {
            student: true,
          },
        });

      if (!existingApplication) {
        return res.status(404).json({
          message:
            "Admission application not found.",
        });
      }

      if (
        existingApplication.status !==
        "PENDING"
      ) {
        return res.status(409).json({
          message:
            "This admission application has already been reviewed.",
        });
      }

      const grade =
        await prisma.grade.findUnique({
          where: {
            id: gradeId,
          },
          include: {
            academicYear: true,
          },
        });

      if (!grade) {
        return res.status(404).json({
          message:
            "Selected KTN class was not found.",
        });
      }

      const result =
        await prisma.$transaction(
          async (tx) => {
            /*
             * Deactivate any old active
             * enrollments for this student.
             */

            await tx.enrollment.updateMany({
              where: {
                studentId:
                  existingApplication.studentId,

                isActive: true,
              },

              data: {
                isActive: false,
              },
            });

            /*
             * Create or reactivate the
             * selected enrollment.
             */

            const existingEnrollment =
              await tx.enrollment.findUnique({
                where: {
                  studentId_gradeId: {
                    studentId:
                      existingApplication.studentId,

                    gradeId,
                  },
                },
              });

            let enrollment;

            if (existingEnrollment) {
              enrollment =
                await tx.enrollment.update({
                  where: {
                    id:
                      existingEnrollment.id,
                  },
                  data: {
                    isActive: true,
                    enrolledAt:
                      new Date(),
                  },
                  include: {
                    grade: {
                      include: {
                        academicYear: true,
                      },
                    },
                  },
                });
            } else {
              enrollment =
                await tx.enrollment.create({
                  data: {
                    studentId:
                      existingApplication.studentId,

                    gradeId,

                    isActive: true,
                  },
                  include: {
                    grade: {
                      include: {
                        academicYear: true,
                      },
                    },
                  },
                });
            }

            /*
             * Approve application.
             */

            const application =
              await tx.admissionApplication.update({
                where: {
                  id: applicationId,
                },

                data: {
                  status: "APPROVED",

                  adminNote:
                    adminNote || null,

                  reviewedById:
                    adminUserId,

                  reviewedAt:
                    new Date(),
                },

                include: {
                  student: true,

                  parent: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          name: true,
                          email: true,
                        },
                      },
                    },
                  },

                  reviewedBy: {
                    select: {
                      id: true,
                      name: true,
                      email: true,
                    },
                  },
                },
              });

            return {
              application,
              enrollment,
            };
          }
        );

      return res.json({
        message:
          "Admission approved and student enrolled successfully.",

        application:
          result.application,

        enrollment:
          result.enrollment,
      });
    } catch (error) {
      console.error(
        "APPROVE admission error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to approve admission application.",
      });
    }
  }
);

/* ========================================
   REJECT ADMISSION
======================================== */

router.patch(
  "/admissions/:applicationId/reject",
  requireAuth,
  requireRole("ADMIN"),
  async (req: AuthenticatedRequest, res) => {
    try {
      const applicationId =
        Number(req.params.applicationId);

      if (
        !Number.isInteger(applicationId) ||
        applicationId <= 0
      ) {
        return res.status(400).json({
          message:
            "Invalid admission application ID.",
        });
      }

      const parsed =
        reviewSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          message:
            parsed.error.issues[0]?.message ||
            "Invalid admission review data.",
        });
      }

      const adminUserId =
        req.auth!.userId;

      const existingApplication =
        await prisma.admissionApplication.findUnique({
          where: {
            id: applicationId,
          },
        });

      if (!existingApplication) {
        return res.status(404).json({
          message:
            "Admission application not found.",
        });
      }

      if (
        existingApplication.status !==
        "PENDING"
      ) {
        return res.status(409).json({
          message:
            "This admission application has already been reviewed.",
        });
      }

      const application =
        await prisma.admissionApplication.update({
          where: {
            id: applicationId,
          },

          data: {
            status: "REJECTED",

            adminNote:
              parsed.data.adminNote ||
              null,

            reviewedById:
              adminUserId,

            reviewedAt:
              new Date(),
          },

          include: {
            student: true,

            parent: {
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                  },
                },
              },
            },

            reviewedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        });

      return res.json({
        message:
          "Admission application rejected.",

        application,
      });
    } catch (error) {
      console.error(
        "REJECT admission error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to reject admission application.",
      });
    }
  }
);

export default router;