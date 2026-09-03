import { Router } from "express";

import { prisma } from "../lib/prisma";

import {
  requireAuth,
  requireRole,
} from "../middleware/auth";

const router = Router();

/*
=========================================================
TEACHER ROUTES
=========================================================
*/

/* ========================================
   GET HOMEWORK CREATED BY TEACHER

   GET /api/homework/teacher
======================================== */

router.get(
  "/teacher",

  requireAuth,
  requireRole("TEACHER"),

  async (req, res) => {
    try {
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

      const homework =
        await prisma.homework.findMany({
          where: {
            teacherId:
              teacher.id,

            isActive: true,

            grade: {
              academicYear: {
                isActive: true,
              },
            },
          },

          include: {
            grade: {
              include: {
                academicYear: true,
              },
            },

            subject: true,
          },

          orderBy: [
            {
              dueDate: "asc",
            },
            {
              createdAt: "desc",
            },
          ],
        });

      return res.json({
        homework,
      });
    } catch (error) {
      console.error(
        "GET TEACHER HOMEWORK ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load homework.",
      });
    }
  }
);

/* ========================================
   GET SUBJECTS ASSIGNED TO TEACHER

   GET /api/homework/teacher/subjects

   ONLY ACTIVE ACADEMIC YEAR
======================================== */

router.get(
  "/teacher/subjects",

  requireAuth,
  requireRole("TEACHER"),

  async (req, res) => {
    try {
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

      const assignments =
        await prisma.subjectTeacher.findMany({
          where: {
            teacherId:
              teacher.id,

            subject: {
              grade: {
                academicYear: {
                  isActive: true,
                },
              },
            },
          },

          include: {
            subject: {
              include: {
                grade: {
                  include: {
                    academicYear: true,
                  },
                },
              },
            },
          },

          orderBy: [
            {
              subject: {
                grade: {
                  id: "asc",
                },
              },
            },
            {
              subject: {
                name: "asc",
              },
            },
          ],
        });

      const subjects =
        assignments.map(
          (assignment) => ({
            assignmentId:
              assignment.id,

            subjectId:
              assignment.subject.id,

            subjectName:
              assignment.subject.name,

            gradeId:
              assignment.subject.grade.id,

            gradeName:
              assignment.subject.grade.name,

            academicYear: {
              id:
                assignment.subject.grade
                  .academicYear.id,

              name:
                assignment.subject.grade
                  .academicYear.name,
            },
          })
        );

      return res.json({
        subjects,
      });
    } catch (error) {
      console.error(
        "GET TEACHER SUBJECTS ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load teacher subjects.",
      });
    }
  }
);

/* ========================================
   CREATE HOMEWORK

   POST /api/homework/teacher
======================================== */

router.post(
  "/teacher",

  requireAuth,
  requireRole("TEACHER"),

  async (req, res) => {
    try {
      const {
        subjectId,
        title,
        description,
        dueDate,
      } = req.body;

      /* ====================================
         VALIDATION
      ==================================== */

      if (
        !subjectId ||
        !title?.trim() ||
        !description?.trim()
      ) {
        return res.status(400).json({
          message:
            "Subject, title, and description are required.",
        });
      }

      const parsedSubjectId =
        Number(subjectId);

      if (
        !Number.isInteger(
          parsedSubjectId
        ) ||
        parsedSubjectId <= 0
      ) {
        return res.status(400).json({
          message:
            "Invalid subject.",
        });
      }

      /* ====================================
         FIND TEACHER
      ==================================== */

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
                id: true,
                name: true,
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
         VERIFY SUBJECT ASSIGNMENT

         Teacher must:
         - be assigned to subject
         - subject must belong to
           active academic year
      ==================================== */

      const assignment =
        await prisma.subjectTeacher.findFirst({
          where: {
            subjectId:
              parsedSubjectId,

            teacherId:
              teacher.id,

            subject: {
              grade: {
                academicYear: {
                  isActive: true,
                },
              },
            },
          },

          include: {
            subject: {
              include: {
                grade: {
                  include: {
                    academicYear: true,
                  },
                },
              },
            },
          },
        });

      if (!assignment) {
        return res.status(403).json({
          message:
            "You can only create homework for subjects assigned to you in the active academic year.",
        });
      }

      /* ====================================
         DUE DATE
      ==================================== */

      let parsedDueDate:
        | Date
        | null = null;

      if (dueDate) {
        parsedDueDate =
          new Date(
            `${dueDate}T00:00:00.000Z`
          );

        if (
          Number.isNaN(
            parsedDueDate.getTime()
          )
        ) {
          return res.status(400).json({
            message:
              "Invalid due date.",
          });
        }
      }

      /* ====================================
         CREATE HOMEWORK
      ==================================== */

      const homework =
        await prisma.homework.create({
          data: {
            title:
              title.trim(),

            description:
              description.trim(),

            gradeId:
              assignment.subject
                .gradeId,

            subjectId:
              assignment.subject.id,

            teacherId:
              teacher.id,

            dueDate:
              parsedDueDate,
          },

          include: {
            grade: {
              include: {
                academicYear: true,
              },
            },

            subject: true,
          },
        });

      return res.status(201).json({
        message:
          "Homework created successfully.",

        homework,
      });
    } catch (error) {
      console.error(
        "CREATE HOMEWORK ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to create homework.",
      });
    }
  }
);

/* ========================================
   UPDATE HOMEWORK

   PUT /api/homework/teacher/:homeworkId
======================================== */

router.put(
  "/teacher/:homeworkId",

  requireAuth,
  requireRole("TEACHER"),

  async (req, res) => {
    try {
      const homeworkId =
        Number(
          req.params.homeworkId
        );

      if (
        !Number.isInteger(
          homeworkId
        ) ||
        homeworkId <= 0
      ) {
        return res.status(400).json({
          message:
            "Invalid homework ID.",
        });
      }

      const {
        subjectId,
        title,
        description,
        dueDate,
      } = req.body;

      if (
        !subjectId ||
        !title?.trim() ||
        !description?.trim()
      ) {
        return res.status(400).json({
          message:
            "Subject, title, and description are required.",
        });
      }

      const parsedSubjectId =
        Number(subjectId);

      if (
        !Number.isInteger(
          parsedSubjectId
        ) ||
        parsedSubjectId <= 0
      ) {
        return res.status(400).json({
          message:
            "Invalid subject.",
        });
      }

      /* ====================================
         FIND TEACHER
      ==================================== */

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
         FIND EXISTING HOMEWORK
      ==================================== */

      const existingHomework =
        await prisma.homework.findUnique({
          where: {
            id:
              homeworkId,
          },
        });

      if (
        !existingHomework ||
        !existingHomework.isActive
      ) {
        return res.status(404).json({
          message:
            "Homework not found.",
        });
      }

      /* ====================================
         OWNERSHIP CHECK
      ==================================== */

      if (
        existingHomework.teacherId !==
        teacher.id
      ) {
        return res.status(403).json({
          message:
            "You can only edit your own homework.",
        });
      }

      /* ====================================
         VERIFY SUBJECT ASSIGNMENT

         Also restrict to active
         academic year.
      ==================================== */

      const assignment =
        await prisma.subjectTeacher.findFirst({
          where: {
            subjectId:
              parsedSubjectId,

            teacherId:
              teacher.id,

            subject: {
              grade: {
                academicYear: {
                  isActive: true,
                },
              },
            },
          },

          include: {
            subject: {
              include: {
                grade: {
                  include: {
                    academicYear: true,
                  },
                },
              },
            },
          },
        });

      if (!assignment) {
        return res.status(403).json({
          message:
            "You can only assign homework for subjects assigned to you in the active academic year.",
        });
      }

      /* ====================================
         DUE DATE
      ==================================== */

      let parsedDueDate:
        | Date
        | null = null;

      if (dueDate) {
        parsedDueDate =
          new Date(
            `${dueDate}T00:00:00.000Z`
          );

        if (
          Number.isNaN(
            parsedDueDate.getTime()
          )
        ) {
          return res.status(400).json({
            message:
              "Invalid due date.",
          });
        }
      }

      /* ====================================
         UPDATE
      ==================================== */

      const homework =
        await prisma.homework.update({
          where: {
            id:
              homeworkId,
          },

          data: {
            title:
              title.trim(),

            description:
              description.trim(),

            gradeId:
              assignment.subject
                .gradeId,

            subjectId:
              assignment.subject.id,

            dueDate:
              parsedDueDate,
          },

          include: {
            grade: {
              include: {
                academicYear: true,
              },
            },

            subject: true,
          },
        });

      return res.json({
        message:
          "Homework updated successfully.",

        homework,
      });
    } catch (error) {
      console.error(
        "UPDATE HOMEWORK ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to update homework.",
      });
    }
  }
);

/* ========================================
   DELETE HOMEWORK

   DELETE /api/homework/teacher/:homeworkId

   SOFT DELETE
======================================== */

router.delete(
  "/teacher/:homeworkId",

  requireAuth,
  requireRole("TEACHER"),

  async (req, res) => {
    try {
      const homeworkId =
        Number(
          req.params.homeworkId
        );

      if (
        !Number.isInteger(
          homeworkId
        ) ||
        homeworkId <= 0
      ) {
        return res.status(400).json({
          message:
            "Invalid homework ID.",
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

      const homework =
        await prisma.homework.findUnique({
          where: {
            id:
              homeworkId,
          },
        });

      if (
        !homework ||
        !homework.isActive
      ) {
        return res.status(404).json({
          message:
            "Homework not found.",
        });
      }

      if (
        homework.teacherId !==
        teacher.id
      ) {
        return res.status(403).json({
          message:
            "You can only remove your own homework.",
        });
      }

      await prisma.homework.update({
        where: {
          id:
            homeworkId,
        },

        data: {
          isActive: false,
        },
      });

      return res.json({
        message:
          "Homework removed successfully.",
      });
    } catch (error) {
      console.error(
        "DELETE HOMEWORK ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to remove homework.",
      });
    }
  }
);

/*
=========================================================
PARENT ROUTES
=========================================================
*/

/* ========================================
   GET LINKED CHILDREN

   GET /api/homework/parent/children
======================================== */

router.get(
  "/parent/children",

  requireAuth,
  requireRole("PARENT"),

  async (req, res) => {
    try {
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

                    grade: {
                      academicYear: {
                        isActive: true,
                      },
                    },
                  },

                  include: {
                    grade: {
                      include: {
                        academicYear: true,
                      },
                    },
                  },

                  take: 1,
                },
              },
            },
          },

          orderBy: {
            student: {
              name: "asc",
            },
          },
        });

      const children =
        links.map((link) => {
          const enrollment =
            link.student
              .enrollments[0];

          return {
            studentId:
              link.student.id,

            name:
              link.student.name ||
              "Unnamed Student",

            admissionNumber:
              link.student
                .admissionNumber,

            relationship:
              link.relationship,

            grade:
              enrollment
                ? {
                    id:
                      enrollment
                        .grade.id,

                    name:
                      enrollment
                        .grade.name,

                    academicYear: {
                      id:
                        enrollment
                          .grade
                          .academicYear.id,

                      name:
                        enrollment
                          .grade
                          .academicYear.name,
                    },
                  }
                : null,
          };
        });

      return res.json({
        children,
      });
    } catch (error) {
      console.error(
        "GET PARENT HOMEWORK CHILDREN ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load children.",
      });
    }
  }
);

/* ========================================
   GET HOMEWORK FOR LINKED CHILD

   GET
   /api/homework/parent/child/:studentId
======================================== */

router.get(
  "/parent/child/:studentId",

  requireAuth,
  requireRole("PARENT"),

  async (req, res) => {
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

      /* ====================================
         FIND PARENT
      ==================================== */

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

      /* ====================================
         SECURITY

         Parent must be directly linked
         to the requested student.
      ==================================== */

      const parentStudent =
        await prisma.parentStudent.findUnique({
          where: {
            parentId_studentId: {
              parentId:
                parent.id,

              studentId,
            },
          },

          include: {
            student: {
              include: {
                enrollments: {
                  where: {
                    isActive: true,

                    grade: {
                      academicYear: {
                        isActive: true,
                      },
                    },
                  },

                  include: {
                    grade: {
                      include: {
                        academicYear: true,
                      },
                    },
                  },

                  take: 1,
                },
              },
            },
          },
        });

      if (
        !parentStudent ||
        !parentStudent.student
          .isActive
      ) {
        return res.status(403).json({
          message:
            "You do not have access to this student.",
        });
      }

      const enrollment =
        parentStudent.student
          .enrollments[0];

      /* ====================================
         NOT YET ENROLLED

         Student may exist while
         admission is still pending.
      ==================================== */

      if (!enrollment) {
        return res.json({
          student: {
            id:
              parentStudent.student.id,

            name:
              parentStudent.student
                .name ||
              "Unnamed Student",

            admissionNumber:
              parentStudent.student
                .admissionNumber,
          },

          grade: null,

          homework: [],
        });
      }

      /* ====================================
         LOAD HOMEWORK FOR CHILD'S
         ACTIVE KTN GRADE
      ==================================== */

      const homework =
        await prisma.homework.findMany({
          where: {
            gradeId:
              enrollment.gradeId,

            isActive: true,

            grade: {
              academicYear: {
                isActive: true,
              },
            },

            teacher: {
              user: {
                isActive: true,
              },
            },
          },

          include: {
            grade: {
              include: {
                academicYear: true,
              },
            },

            subject: true,

            /*
             * Teacher still has
             * a User login account.
             */

            teacher: {
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

          orderBy: [
            {
              dueDate: "asc",
            },
            {
              createdAt: "desc",
            },
          ],
        });

      return res.json({
        student: {
          id:
            parentStudent.student.id,

          name:
            parentStudent.student
              .name ||
            "Unnamed Student",

          admissionNumber:
            parentStudent.student
              .admissionNumber,
        },

        grade: {
          id:
            enrollment.grade.id,

          name:
            enrollment.grade.name,

          academicYear: {
            id:
              enrollment.grade
                .academicYear.id,

            name:
              enrollment.grade
                .academicYear.name,
          },
        },

        homework,
      });
    } catch (error) {
      console.error(
        "GET PARENT CHILD HOMEWORK ERROR:",
        error
      );

      return res.status(500).json({
        message:
          "Failed to load homework.",
      });
    }
  }
);

export default router;