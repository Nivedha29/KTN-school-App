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

/* ========================================
   VALIDATION
======================================== */

const createTeacherSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2),

  email: z
    .string()
    .trim()
    .email(),

  password: z
    .string()
    .min(8),

  employeeNumber: z
    .string()
    .trim()
    .min(1),

  phone: z
    .string()
    .trim()
    .optional(),
});

/* ========================================
   GET MY CLASSES / SUBJECTS

   GET /api/teachers/me/classes

   TEACHER ONLY
======================================== */

router.get(
  "/me/classes",

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
            employeeNumber: true,
            phone: true,

            user: {
              select: {
                id: true,
                name: true,
                email: true,
                isActive: true,
              },
            },

            subjectAssignments: {
              orderBy: {
                subjectId: "asc",
              },

              select: {
                id: true,

                subject: {
                  select: {
                    id: true,
                    name: true,

                    grade: {
                      select: {
                        id: true,
                        name: true,

                        academicYear: {
                          select: {
                            id: true,
                            name: true,
                            isActive: true,
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

      if (!teacher) {
        return res.status(404).json({
          message:
            "Teacher profile not found.",
        });
      }

      if (!teacher.user.isActive) {
        return res.status(403).json({
          message:
            "Teacher account is inactive.",
        });
      }

      const activeAssignments =
        teacher.subjectAssignments.filter(
          (assignment) =>
            assignment.subject.grade
              .academicYear.isActive
        );

      const classMap =
        new Map<
          number,
          {
            gradeId: number;
            gradeName: string;

            academicYear: {
              id: number;
              name: string;
            };

            subjects: {
              assignmentId: number;
              subjectId: number;
              subjectName: string;
            }[];
          }
        >();

      for (
        const assignment of activeAssignments
      ) {
        const subject =
          assignment.subject;

        const grade =
          subject.grade;

        if (!classMap.has(grade.id)) {
          classMap.set(
            grade.id,
            {
              gradeId:
                grade.id,

              gradeName:
                grade.name,

              academicYear: {
                id:
                  grade.academicYear.id,

                name:
                  grade.academicYear.name,
              },

              subjects: [],
            }
          );
        }

        classMap
          .get(grade.id)!
          .subjects.push({
            assignmentId:
              assignment.id,

            subjectId:
              subject.id,

            subjectName:
              subject.name,
          });
      }

      const classes =
        Array.from(
          classMap.values()
        ).sort(
          (a, b) =>
            a.gradeName.localeCompare(
              b.gradeName,
              undefined,
              {
                numeric: true,
              }
            )
        );

      for (
        const classItem of classes
      ) {
        classItem.subjects.sort(
          (a, b) =>
            a.subjectName.localeCompare(
              b.subjectName
            )
        );
      }

      return res.json({
        teacher: {
          id:
            teacher.id,

          userId:
            teacher.user.id,

          name:
            teacher.user.name,

          email:
            teacher.user.email,

          employeeNumber:
            teacher.employeeNumber,

          phone:
            teacher.phone,
        },

        classes,

        totalClasses:
          classes.length,

        totalSubjects:
          activeAssignments.length,
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
   GET STUDENTS FOR MY ASSIGNED CLASS

   GET
   /api/teachers/me/classes/:gradeId/students

   TEACHER ONLY
======================================== */

router.get(
  "/me/classes/:gradeId/students",

  requireAuth,
  requireRole("TEACHER"),

  async (
    req: AuthenticatedRequest,
    res
  ) => {
    try {
      const userId =
        req.auth!.userId;

      const gradeId =
        Number(
          req.params.gradeId
        );

      if (
        !Number.isInteger(
          gradeId
        ) ||
        gradeId <= 0
      ) {
        return res.status(400).json({
          message:
            "Invalid class ID.",
        });
      }

      /* ====================================
         FIND LOGGED-IN TEACHER
      ==================================== */

      const teacher =
        await prisma.teacherProfile.findUnique({
          where: {
            userId,
          },

          select: {
            id: true,
            employeeNumber: true,

            user: {
              select: {
                id: true,
                name: true,
                email: true,
                isActive: true,
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

      if (!teacher.user.isActive) {
        return res.status(403).json({
          message:
            "Teacher account is inactive.",
        });
      }

      /* ====================================
         CHECK TEACHER CLASS ACCESS

         Teacher must have at least one
         subject assigned to this grade.
      ==================================== */

      const assignments =
        await prisma.subjectTeacher.findMany({
          where: {
            teacherId:
              teacher.id,

            subject: {
              gradeId,

              grade: {
                academicYear: {
                  isActive: true,
                },
              },
            },
          },

          select: {
            id: true,

            subject: {
              select: {
                id: true,
                name: true,

                grade: {
                  select: {
                    id: true,
                    name: true,

                    academicYear: {
                      select: {
                        id: true,
                        name: true,
                        isActive: true,
                      },
                    },
                  },
                },
              },
            },
          },

          orderBy: {
            subjectId: "asc",
          },
        });

      if (
        assignments.length === 0
      ) {
        return res.status(403).json({
          message:
            "You are not assigned to this class.",
        });
      }

      const grade =
        assignments[0]
          .subject.grade;

      /* ====================================
         LOAD ACTIVE STUDENTS

         Only:
         - active StudentProfile
         - active Enrollment
         - selected grade
         - active academic year
      ==================================== */

      const enrollments =
        await prisma.enrollment.findMany({
          where: {
            gradeId,

            isActive: true,

            student: {
              isActive: true,
            },

            grade: {
              academicYear: {
                isActive: true,
              },
            },
          },

          select: {
            id: true,
            enrolledAt: true,

            student: {
              select: {
                id: true,
                name: true,
                admissionNumber: true,
                dateOfBirth: true,
                gender: true,
                schoolName: true,
                schoolGrade: true,
              },
            },
          },

          orderBy: {
            student: {
              name: "asc",
            },
          },
        });

      const students =
        enrollments.map(
          (enrollment) => ({
            id:
              enrollment.student.id,

            name:
              enrollment.student.name ||
              "Unnamed Student",

            admissionNumber:
              enrollment.student
                .admissionNumber,

            dateOfBirth:
              enrollment.student
                .dateOfBirth,

            gender:
              enrollment.student.gender,

            currentSchool:
              enrollment.student
                .schoolName,

            currentSchoolGrade:
              enrollment.student
                .schoolGrade,

            enrollmentId:
              enrollment.id,

            enrolledAt:
              enrollment.enrolledAt,
          })
        );

      /* ====================================
         SUBJECTS THIS TEACHER TEACHES
         IN THIS CLASS
      ==================================== */

      const subjects =
        assignments
          .map(
            (assignment) => ({
              assignmentId:
                assignment.id,

              id:
                assignment.subject.id,

              name:
                assignment.subject.name,
            })
          )
          .sort(
            (a, b) =>
              a.name.localeCompare(
                b.name
              )
          );

      return res.json({
        teacher: {
          id:
            teacher.id,

          userId:
            teacher.user.id,

          name:
            teacher.user.name,

          email:
            teacher.user.email,

          employeeNumber:
            teacher.employeeNumber,
        },

        class: {
          id:
            grade.id,

          name:
            grade.name,

          academicYear: {
            id:
              grade.academicYear.id,

            name:
              grade.academicYear.name,
          },
        },

        subjects,

        students,

        totalStudents:
          students.length,
      });
    } catch (error) {
      console.error(
        "Get teacher class students error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load class students.",
      });
    }
  }
);

/* ========================================
   GET ALL TEACHERS

   GET /api/teachers

   ADMIN ONLY
======================================== */

router.get(
  "/",

  requireAuth,
  requireRole("ADMIN"),

  async (_req, res) => {
    try {
      const teachers =
        await prisma.user.findMany({
          where: {
            role: "TEACHER",
          },

          orderBy: {
            name: "asc",
          },

          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            createdAt: true,

            teacherProfile: {
              select: {
                id: true,
                employeeNumber: true,
                phone: true,

                subjectAssignments: {
                  select: {
                    id: true,

                    subject: {
                      select: {
                        id: true,
                        name: true,

                        grade: {
                          select: {
                            id: true,
                            name: true,

                            academicYear: {
                              select: {
                                id: true,
                                name: true,
                                isActive: true,
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

      return res.json({
        teachers,
      });
    } catch (error) {
      console.error(
        "Get teachers error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load teachers.",
      });
    }
  }
);

/* ========================================
   CREATE TEACHER

   POST /api/teachers

   ADMIN ONLY
======================================== */

router.post(
  "/",

  requireAuth,
  requireRole("ADMIN"),

  async (req, res) => {
    try {
      const parsed =
        createTeacherSchema.safeParse(
          req.body
        );

      if (!parsed.success) {
        return res.status(400).json({
          message:
            "Please check the teacher information.",

          errors:
            parsed.error.flatten(),
        });
      }

      const {
        name,
        email,
        password,
        employeeNumber,
        phone,
      } = parsed.data;

      const normalizedEmail =
        email.toLowerCase();

      /* ====================================
         CHECK EMAIL
      ==================================== */

      const existingUser =
        await prisma.user.findUnique({
          where: {
            email:
              normalizedEmail,
          },
        });

      if (existingUser) {
        return res.status(409).json({
          message:
            "A user with this email already exists.",
        });
      }

      /* ====================================
         CHECK EMPLOYEE NUMBER
      ==================================== */

      const existingEmployeeNumber =
        await prisma.teacherProfile.findUnique({
          where: {
            employeeNumber,
          },
        });

      if (
        existingEmployeeNumber
      ) {
        return res.status(409).json({
          message:
            "This employee number is already in use.",
        });
      }

      /* ====================================
         HASH PASSWORD
      ==================================== */

      const passwordHash =
        await argon2.hash(
          password
        );

      /* ====================================
         CREATE USER + TEACHER PROFILE
      ==================================== */

      const teacher =
        await prisma.user.create({
          data: {
            name,

            email:
              normalizedEmail,

            passwordHash,

            role:
              "TEACHER",

            isActive:
              true,

            teacherProfile: {
              create: {
                employeeNumber,

                phone:
                  phone &&
                  phone.length > 0
                    ? phone
                    : null,
              },
            },
          },

          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,

            teacherProfile: {
              select: {
                id: true,
                employeeNumber: true,
                phone: true,
              },
            },
          },
        });

      return res
        .status(201)
        .json({
          message:
            "Teacher created successfully.",

          teacher,
        });
    } catch (error) {
      console.error(
        "Create teacher error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to create teacher.",
      });
    }
  }
);

/* ========================================
   ASSIGN SUBJECTS TO TEACHER

   PUT
   /api/teachers/:teacherProfileId/subjects

   ADMIN ONLY
======================================== */

router.put(
  "/:teacherProfileId/subjects",

  requireAuth,
  requireRole("ADMIN"),

  async (req, res) => {
    try {
      const teacherProfileId =
        Number(
          req.params
            .teacherProfileId
        );

      if (
        !Number.isInteger(
          teacherProfileId
        ) ||
        teacherProfileId <= 0
      ) {
        return res.status(400).json({
          message:
            "Invalid teacher ID.",
        });
      }

      const subjectIdsSchema =
        z.object({
          subjectIds: z
            .array(
              z
                .number()
                .int()
                .positive()
            )
            .default([]),
        });

      const parsed =
        subjectIdsSchema.safeParse(
          req.body
        );

      if (!parsed.success) {
        return res.status(400).json({
          message:
            "Please provide a valid list of subjects.",

          errors:
            parsed.error.flatten(),
        });
      }

      const subjectIds = [
        ...new Set(
          parsed.data.subjectIds
        ),
      ];

      /* ====================================
         CHECK TEACHER
      ==================================== */

      const teacher =
        await prisma.teacherProfile.findUnique({
          where: {
            id:
              teacherProfileId,
          },

          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                isActive: true,
              },
            },
          },
        });

      if (!teacher) {
        return res.status(404).json({
          message:
            "Teacher not found.",
        });
      }

      if (!teacher.user.isActive) {
        return res.status(400).json({
          message:
            "Cannot assign subjects to an inactive teacher.",
        });
      }

      /* ====================================
         CHECK SUBJECTS
      ==================================== */

      if (
        subjectIds.length > 0
      ) {
        const subjects =
          await prisma.subject.findMany({
            where: {
              id: {
                in:
                  subjectIds,
              },

              grade: {
                academicYear: {
                  isActive:
                    true,
                },
              },
            },

            select: {
              id: true,
            },
          });

        if (
          subjects.length !==
          subjectIds.length
        ) {
          return res.status(400).json({
            message:
              "One or more selected subjects are invalid or do not belong to the active academic year.",
          });
        }
      }

      /* ====================================
         REPLACE SUBJECT ASSIGNMENTS
      ==================================== */

      await prisma.$transaction(
        async (tx) => {
          await tx.subjectTeacher.deleteMany({
            where: {
              teacherId:
                teacherProfileId,
            },
          });

          if (
            subjectIds.length > 0
          ) {
            await tx.subjectTeacher.createMany({
              data:
                subjectIds.map(
                  (
                    subjectId
                  ) => ({
                    teacherId:
                      teacherProfileId,

                    subjectId,
                  })
                ),
            });
          }
        }
      );

      /* ====================================
         RETURN UPDATED TEACHER
      ==================================== */

      const updatedTeacher =
        await prisma.teacherProfile.findUnique({
          where: {
            id:
              teacherProfileId,
          },

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

            subjectAssignments: {
              orderBy: {
                subjectId:
                  "asc",
              },

              select: {
                id: true,

                subject: {
                  select: {
                    id: true,
                    name: true,

                    grade: {
                      select: {
                        id: true,
                        name: true,

                        academicYear: {
                          select: {
                            id: true,
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
        });

      return res.json({
        message:
          "Teacher subject assignments updated successfully.",

        teacher:
          updatedTeacher,
      });
    } catch (error) {
      console.error(
        "Assign teacher subjects error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to update teacher subject assignments.",
      });
    }
  }
);

export default router;