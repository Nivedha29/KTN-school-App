import { Router } from "express";

import { prisma } from "../lib/prisma";

import {
  requireAuth,
  requireRole,
} from "../middleware/auth";

const router = Router();

router.use(requireAuth);

/* =========================================================
   TEACHER - GET ASSIGNED SUBJECTS

   Only subjects from the active academic year.
========================================================= */

router.get(
  "/teacher/subjects",
  requireRole("TEACHER"),
  async (req, res) => {
    try {
      const teacher =
        await prisma.teacherProfile.findUnique({
          where: {
            userId: req.auth!.userId,
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
            teacherId: teacher.id,

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
        "Teacher results subjects error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load teacher subjects.",
      });
    }
  }
);

/* =========================================================
   TEACHER - GET AVAILABLE EXAMS

   Exams from active academic year only.
========================================================= */

router.get(
  "/teacher/exams",
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

      const academicYear =
        await prisma.academicYear.findFirst({
          where: {
            isActive: true,
          },
        });

      if (!academicYear) {
        return res.status(404).json({
          message:
            "No active academic year found.",
        });
      }

      const exams =
        await prisma.exam.findMany({
          where: {
            academicYearId:
              academicYear.id,

            isActive: true,
          },

          orderBy: {
            id: "asc",
          },
        });

      return res.json({
        academicYear: {
          id:
            academicYear.id,

          name:
            academicYear.name,
        },

        exams,
      });
    } catch (error) {
      console.error(
        "Teacher exams error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load exams.",
      });
    }
  }
);

/* =========================================================
   TEACHER - GET STUDENTS FOR SUBJECT
========================================================= */

router.get(
  "/teacher/subject/:subjectId/students",
  requireRole("TEACHER"),
  async (req, res) => {
    try {
      const subjectId =
        Number(
          req.params.subjectId
        );

      if (
        !Number.isInteger(subjectId) ||
        subjectId <= 0
      ) {
        return res.status(400).json({
          message:
            "Invalid subject ID.",
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

      const assignment =
        await prisma.subjectTeacher.findFirst({
          where: {
            teacherId:
              teacher.id,

            subjectId,

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
            "You are not assigned to this subject in the active academic year.",
        });
      }

      const enrollments =
        await prisma.enrollment.findMany({
          where: {
            gradeId:
              assignment.subject.gradeId,

            isActive: true,

            grade: {
              academicYear: {
                isActive: true,
              },
            },

            student: {
              isActive: true,
            },
          },

          include: {
            student: {
              select: {
                id: true,
                name: true,
                admissionNumber: true,
                isActive: true,
              },
            },
          },
        });

      const students =
        enrollments
          .map(
            (enrollment) => ({
              studentId:
                enrollment.student.id,

              admissionNumber:
                enrollment.student
                  .admissionNumber,

              name:
                enrollment.student.name ||
                "Unnamed Student",
            })
          )
          .sort((a, b) => {
            const admissionCompare =
              (
                a.admissionNumber || ""
              ).localeCompare(
                b.admissionNumber || "",
                undefined,
                {
                  numeric: true,
                }
              );

            if (admissionCompare !== 0) {
              return admissionCompare;
            }

            return a.name.localeCompare(
              b.name
            );
          });

      return res.json({
        subject: {
          id:
            assignment.subject.id,

          name:
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
        },

        students,
      });
    } catch (error) {
      console.error(
        "Teacher subject students error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load students.",
      });
    }
  }
);

/* =========================================================
   TEACHER - GET RESULTS FOR SUBJECT + EXAM
========================================================= */

router.get(
  "/teacher/subject/:subjectId/exam/:examId",
  requireRole("TEACHER"),
  async (req, res) => {
    try {
      const subjectId =
        Number(
          req.params.subjectId
        );

      const examId =
        Number(
          req.params.examId
        );

      if (
        !Number.isInteger(subjectId) ||
        subjectId <= 0 ||
        !Number.isInteger(examId) ||
        examId <= 0
      ) {
        return res.status(400).json({
          message:
            "Invalid subject or exam ID.",
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

      /* -------------------------------------
         Verify teacher subject assignment
         and active academic year.
      ------------------------------------- */

      const assignment =
        await prisma.subjectTeacher.findFirst({
          where: {
            teacherId:
              teacher.id,

            subjectId,

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
            "You are not assigned to this subject in the active academic year.",
        });
      }

      /* -------------------------------------
         Exam must belong to the SAME
         academic year as subject's grade.
      ------------------------------------- */

      const exam =
        await prisma.exam.findFirst({
          where: {
            id:
              examId,

            isActive: true,

            academicYearId:
              assignment.subject.grade
                .academicYearId,
          },
        });

      if (!exam) {
        return res.status(404).json({
          message:
            "Exam not found for this academic year.",
        });
      }

      /* -------------------------------------
         Active students in same grade.
      ------------------------------------- */

      const enrollments =
        await prisma.enrollment.findMany({
          where: {
            gradeId:
              assignment.subject.gradeId,

            isActive: true,

            grade: {
              academicYear: {
                isActive: true,
              },
            },

            student: {
              isActive: true,
            },
          },

          include: {
            student: {
              select: {
                id: true,
                name: true,
                admissionNumber: true,
              },
            },
          },
        });

      const studentIds =
        enrollments.map(
          (enrollment) =>
            enrollment.studentId
        );

      /*
       * Limit result query to students
       * currently enrolled in this grade.
       */

      const existingResults =
        studentIds.length > 0
          ? await prisma.examResult.findMany({
              where: {
                examId,
                subjectId,

                studentId: {
                  in: studentIds,
                },
              },
            })
          : [];

      const resultMap =
        new Map(
          existingResults.map(
            (result) => [
              result.studentId,
              result,
            ]
          )
        );

      const students =
        enrollments
          .map(
            (enrollment) => {
              const result =
                resultMap.get(
                  enrollment.student.id
                );

              return {
                studentId:
                  enrollment.student.id,

                admissionNumber:
                  enrollment.student
                    .admissionNumber,

                name:
                  enrollment.student.name ||
                  "Unnamed Student",

                resultId:
                  result?.id ?? null,

                marksObtained:
                  result?.marksObtained ??
                  null,

                maxMarks:
                  result?.maxMarks ??
                  null,

                remarks:
                  result?.remarks || "",
              };
            }
          )
          .sort((a, b) => {
            const admissionCompare =
              (
                a.admissionNumber || ""
              ).localeCompare(
                b.admissionNumber || "",
                undefined,
                {
                  numeric: true,
                }
              );

            if (admissionCompare !== 0) {
              return admissionCompare;
            }

            return a.name.localeCompare(
              b.name
            );
          });

      return res.json({
        exam,

        subject: {
          id:
            assignment.subject.id,

          name:
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
        },

        students,
      });
    } catch (error) {
      console.error(
        "Teacher subject exam results error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load exam results.",
      });
    }
  }
);

/* =========================================================
   TEACHER - SAVE / UPDATE RESULTS
========================================================= */

router.post(
  "/teacher",
  requireRole("TEACHER"),
  async (req, res) => {
    try {
      const {
        examId,
        subjectId,
        results,
      } = req.body;

      if (
        !Number.isInteger(examId) ||
        examId <= 0 ||
        !Number.isInteger(subjectId) ||
        subjectId <= 0
      ) {
        return res.status(400).json({
          message:
            "Exam and subject are required.",
        });
      }

      if (
        !Array.isArray(results) ||
        results.length === 0
      ) {
        return res.status(400).json({
          message:
            "At least one student result is required.",
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

      /* -------------------------------------
         Verify teacher assignment.
      ------------------------------------- */

      const assignment =
        await prisma.subjectTeacher.findFirst({
          where: {
            teacherId:
              teacher.id,

            subjectId,

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
            "You are not assigned to this subject in the active academic year.",
        });
      }

      /* -------------------------------------
         Exam must belong to SAME year.
      ------------------------------------- */

      const exam =
        await prisma.exam.findFirst({
          where: {
            id:
              examId,

            isActive: true,

            academicYearId:
              assignment.subject.grade
                .academicYearId,
          },
        });

      if (!exam) {
        return res.status(404).json({
          message:
            "Exam not found for this academic year.",
        });
      }

      /* -------------------------------------
         Find valid enrolled students.
      ------------------------------------- */

      const validEnrollments =
        await prisma.enrollment.findMany({
          where: {
            gradeId:
              assignment.subject.gradeId,

            isActive: true,

            grade: {
              academicYear: {
                isActive: true,
              },
            },

            student: {
              isActive: true,
            },
          },

          select: {
            studentId: true,
          },
        });

      const validStudentIds =
        new Set(
          validEnrollments.map(
            (enrollment) =>
              enrollment.studentId
          )
        );

      /* -------------------------------------
         Prevent duplicate students in
         one submission.
      ------------------------------------- */

      const submittedStudentIds =
        results.map(
          (item) =>
            item.studentId
        );

      const uniqueStudentIds =
        new Set(
          submittedStudentIds
        );

      if (
        uniqueStudentIds.size !==
        submittedStudentIds.length
      ) {
        return res.status(400).json({
          message:
            "Duplicate students were found in the result list.",
        });
      }

      /* -------------------------------------
         Validate every result.
      ------------------------------------- */

      const validatedResults = [];

      for (const item of results) {
        if (
          !Number.isInteger(
            item.studentId
          ) ||
          !validStudentIds.has(
            item.studentId
          )
        ) {
          return res.status(400).json({
            message:
              "One or more students are invalid for this class.",
          });
        }

        const marksObtained =
          Number(
            item.marksObtained
          );

        const maxMarks =
          Number(
            item.maxMarks
          );

        if (
          !Number.isFinite(
            marksObtained
          ) ||
          !Number.isFinite(
            maxMarks
          ) ||
          maxMarks <= 0 ||
          marksObtained < 0 ||
          marksObtained >
            maxMarks
        ) {
          return res.status(400).json({
            message:
              "Marks must be between 0 and the maximum marks.",
          });
        }

        validatedResults.push({
          studentId:
            item.studentId,

          marksObtained,

          maxMarks,

          remarks:
            typeof item.remarks ===
              "string" &&
            item.remarks.trim()
              ? item.remarks.trim()
              : null,
        });
      }

      /* -------------------------------------
         Save results.
      ------------------------------------- */

      await prisma.$transaction(
        validatedResults.map(
          (item) =>
            prisma.examResult.upsert({
              where: {
                examId_studentId_subjectId:
                  {
                    examId,

                    studentId:
                      item.studentId,

                    subjectId,
                  },
              },

              update: {
                marksObtained:
                  item.marksObtained,

                maxMarks:
                  item.maxMarks,

                remarks:
                  item.remarks,

                teacherId:
                  teacher.id,
              },

              create: {
                examId,

                studentId:
                  item.studentId,

                subjectId,

                teacherId:
                  teacher.id,

                marksObtained:
                  item.marksObtained,

                maxMarks:
                  item.maxMarks,

                remarks:
                  item.remarks,
              },
            })
        )
      );

      return res.json({
        message:
          "Exam results saved successfully.",
      });
    } catch (error) {
      console.error(
        "Save exam results error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to save exam results.",
      });
    }
  }
);

/* =========================================================
   PARENT - GET LINKED CHILDREN
========================================================= */

router.get(
  "/parent/children",
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
        });

      const children =
        links
          .map(
            (link) => {
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
                  link.relationship ||
                  null,

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
                              .academicYear
                              .id,

                          name:
                            enrollment
                              .grade
                              .academicYear
                              .name,
                        },
                      }
                    : null,
              };
            }
          )
          .sort((a, b) => {
            const admissionCompare =
              (
                a.admissionNumber || ""
              ).localeCompare(
                b.admissionNumber || "",
                undefined,
                {
                  numeric: true,
                }
              );

            if (admissionCompare !== 0) {
              return admissionCompare;
            }

            return a.name.localeCompare(
              b.name
            );
          });

      return res.json({
        children,
      });
    } catch (error) {
      console.error(
        "Parent results children error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load linked children.",
      });
    }
  }
);

/* =========================================================
   PARENT - GET CHILD RESULTS
========================================================= */

router.get(
  "/parent/child/:studentId",
  requireRole("PARENT"),
  async (req, res) => {
    try {
      const studentId =
        Number(
          req.params.studentId
        );

      if (
        !Number.isInteger(studentId) ||
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

      /* -------------------------------------
         Parent must be linked to student.
      ------------------------------------- */

      const link =
        await prisma.parentStudent.findUnique({
          where: {
            parentId_studentId: {
              parentId:
                parent.id,

              studentId,
            },
          },

          include: {
            student: true,
          },
        });

      if (
        !link ||
        !link.student.isActive
      ) {
        return res.status(403).json({
          message:
            "You are not linked to this student.",
        });
      }

      /* -------------------------------------
         Active enrollment only.
      ------------------------------------- */

      const enrollment =
        await prisma.enrollment.findFirst({
          where: {
            studentId,

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
        });

      /*
       * Child can exist before
       * admission approval.
       */

      if (!enrollment) {
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
          },

          grade: null,

          academicYear: null,

          exams: [],
        });
      }

      /* -------------------------------------
         Exams for child's academic year.
      ------------------------------------- */

      const exams =
        await prisma.exam.findMany({
          where: {
            academicYearId:
              enrollment.grade
                .academicYearId,

            isActive: true,
          },

          orderBy: {
            id: "asc",
          },
        });

      /* -------------------------------------
         Results:
         - same student
         - same academic year
         - same KTN grade
      ------------------------------------- */

      const results =
        await prisma.examResult.findMany({
          where: {
            studentId,

            exam: {
              academicYearId:
                enrollment.grade
                  .academicYearId,

              isActive: true,
            },

            subject: {
              gradeId:
                enrollment.gradeId,
            },
          },

          include: {
            subject: {
              select: {
                id: true,
                name: true,
              },
            },

            /*
             * Teacher still has
             * a User login account.
             */

            teacher: {
              include: {
                user: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },

          orderBy: [
            {
              examId: "asc",
            },
            {
              subject: {
                name: "asc",
              },
            },
          ],
        });

      const formattedResults =
        exams.map(
          (exam) => ({
            exam: {
              id:
                exam.id,

              examType:
                exam.examType,
            },

            results:
              results
                .filter(
                  (result) =>
                    result.examId ===
                    exam.id
                )
                .map(
                  (result) => ({
                    resultId:
                      result.id,

                    subject: {
                      id:
                        result.subject.id,

                      name:
                        result.subject
                          .name,
                    },

                    marksObtained:
                      result
                        .marksObtained,

                    maxMarks:
                      result
                        .maxMarks,

                    percentage:
                      result.maxMarks >
                      0
                        ? Math.round(
                            (result
                              .marksObtained /
                              result
                                .maxMarks) *
                              10000
                          ) / 100
                        : 0,

                    remarks:
                      result.remarks ||
                      "",

                    teacher:
                      result.teacher
                        .user.name,
                  })
                ),
          })
        );

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
        },

        grade: {
          id:
            enrollment.grade.id,

          name:
            enrollment.grade.name,
        },

        academicYear: {
          id:
            enrollment.grade
              .academicYear.id,

          name:
            enrollment.grade
              .academicYear.name,
        },

        exams:
          formattedResults,
      });
    } catch (error) {
      console.error(
        "Parent child results error:",
        error
      );

      return res.status(500).json({
        message:
          "Unable to load child results.",
      });
    }
  }
);

export default router;