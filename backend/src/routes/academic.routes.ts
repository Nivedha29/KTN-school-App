import { Router } from "express";

import { prisma } from "../lib/prisma";
import {
  requireAuth,
  requireRole,
} from "../middleware/auth";

const router = Router();

router.get(
  "/grades",
  requireAuth,
  requireRole("ADMIN"),
  async (_req, res) => {
    try {
      const academicYear =
        await prisma.academicYear.findFirst({
          where: {
            isActive: true,
          },
          include: {
            grades: {
              include: {
                subjects: {
                  orderBy: {
                    name: "asc",
                  },
                },
                _count: {
                  select: {
                    enrollments: true,
                  },
                },
              },
              orderBy: {
                id: "asc",
              },
            },
          },
        });

      if (!academicYear) {
        return res.status(404).json({
          message: "No active academic year found.",
        });
      }

      return res.json({
        academicYear: {
          id: academicYear.id,
          name: academicYear.name,
          startDate: academicYear.startDate,
          endDate: academicYear.endDate,
        },

        grades: academicYear.grades.map((grade) => ({
          id: grade.id,
          name: grade.name,
          studentCount: grade._count.enrollments,
          subjects: grade.subjects.map((subject) => ({
            id: subject.id,
            name: subject.name,
          })),
        })),
      });
    } catch (error) {
      console.error("Get grades error:", error);

      return res.status(500).json({
        message: "Unable to load grades.",
      });
    }
  }
);

export default router;