import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes";
import studentRoutes from "./routes/students.routes";
import academicRoutes from "./routes/academic.routes";
import teacherRoutes from "./routes/teachers.routes";
import timetableRoutes from "./routes/timetable.routes";
import attendanceRoutes from "./routes/attendance.routes";
import homeworkRoutes from "./routes/homework.routes";
import resultsRoutes from "./routes/results.routes";
import noticeRoutes from "./routes/notice.routes";
import parentRoutes from "./routes/parents.routes";
import adminRoutes from "./routes/admin.routes";
import settingsRoutes from "./routes/settings.routes";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

/* ========================================
   HEALTH
======================================== */

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    application: "KTN Digital School API",
  });
});

/* ========================================
   AUTH
======================================== */

app.use(
  "/api/auth",
  authRoutes
);

/* ========================================
   ADMIN
======================================== */

app.use(
  "/api/admin",
  adminRoutes
);

/* ========================================
   STUDENTS
======================================== */

app.use(
  "/api/students",
  studentRoutes
);

/* ========================================
   PARENTS
======================================== */

app.use(
  "/api/parents",
  parentRoutes
);

/* ========================================
   ACADEMIC
======================================== */

app.use(
  "/api/academic",
  academicRoutes
);

/* ========================================
   TEACHERS
======================================== */

app.use(
  "/api/teachers",
  teacherRoutes
);

/* ========================================
   TIMETABLE
======================================== */

app.use(
  "/api/timetable",
  timetableRoutes
);

/* ========================================
   ATTENDANCE
======================================== */

app.use(
  "/api/attendance",
  attendanceRoutes
);

/* ========================================
   HOMEWORK
======================================== */

app.use(
  "/api/homework",
  homeworkRoutes
);

/* ========================================
   RESULTS
======================================== */

app.use(
  "/api/results",
  resultsRoutes
);

/* ========================================
   NOTICES
======================================== */

app.use(
  "/api/notices",
  noticeRoutes
);

app.use(
  "/api/settings",
  settingsRoutes
);

export default app;