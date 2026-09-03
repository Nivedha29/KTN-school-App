import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import PublicLayout from "../components/layout/PublicLayout";
import PortalLayout from "../components/layout/PortalLayout";
import ProtectedRoute from "../components/common/ProtectedRoute";

import Home from "../pages/public/Home";

import About from "../components/About";
import Classes from "../components/Classes";
import Teachers from "../components/Teachers";
import News from "../components/News";
import Apply from "../components/Apply";

import Login from "../pages/auth/Login";
import ParentRegister from "../pages/auth/ParentRegister";

import TeacherDashboard from "../pages/teacher/TeacherDashboard";
import Attendance from "../pages/teacher/Attendance";
import TeacherHomework from "../pages/teacher/Homework";
import TeacherResults from "../pages/teacher/Results";
import MyClasses from "../pages/teacher/MyClasses";

import ParentDashboard from "../pages/parent/ParentDashboard";
import ParentAttendance from "../pages/parent/Attendance";
import ParentHomework from "../pages/parent/Homework";
import ParentResults from "../pages/parent/Results";
import MyChildren from "../pages/parent/MyChildren";

import AdminDashboard from "../pages/admin/AdminDashboard";
import Students from "../pages/admin/Students";
import GradesSubjects from "../pages/admin/GradesSubjects";
import AdminTeachers from "../pages/admin/Teachers";
import Timetable from "../pages/admin/Timetable";
import AdminAttendance from "../pages/admin/Attendance";
import Notices from "../pages/admin/Notices";
import Applications from "../pages/admin/Applications";

import Notifications from "../pages/shared/Notifications";
import Settings from "../pages/settings/Settings";

export default function AppRoutes() {
  return (
    <Routes>
      {/* =====================================
          PUBLIC WEBSITE
      ===================================== */}

      <Route element={<PublicLayout />}>
        <Route
          index
          element={<Home />}
        />

        <Route
          path="/about"
          element={<About />}
        />

        <Route
          path="/classes"
          element={<Classes />}
        />

        <Route
          path="/teachers"
          element={<Teachers />}
        />

        <Route
          path="/news"
          element={<News />}
        />

        <Route
          path="/apply"
          element={<Apply />}
        />
      </Route>

      {/* =====================================
          AUTHENTICATION
      ===================================== */}

      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register-parent"
        element={<ParentRegister />}
      />

      {/* =====================================
          TEACHER
      ===================================== */}

      <Route
        path="/teacher"
        element={
          <ProtectedRoute
            allowedRoles={[
              "TEACHER",
            ]}
          >
            <PortalLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <Navigate
              to="dashboard"
              replace
            />
          }
        />

        <Route
          path="dashboard"
          element={
            <TeacherDashboard />
          }
        />

        <Route
          path="classes"
          element={<MyClasses />}
        />

        <Route
          path="attendance"
          element={<Attendance />}
        />

        <Route
          path="homework"
          element={
            <TeacherHomework />
          }
        />

        <Route
          path="results"
          element={
            <TeacherResults />
          }
        />

        <Route
          path="notifications"
          element={
            <Notifications />
          }
        />

        <Route
          path="settings"
          element={<Settings />}
        />
      </Route>

      {/* =====================================
          PARENT
      ===================================== */}

      <Route
        path="/parent"
        element={
          <ProtectedRoute
            allowedRoles={[
              "PARENT",
            ]}
          >
            <PortalLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <Navigate
              to="dashboard"
              replace
            />
          }
        />

        <Route
          path="dashboard"
          element={
            <ParentDashboard />
          }
        />

        <Route
          path="children"
          element={<MyChildren />}
        />

        <Route
          path="attendance"
          element={
            <ParentAttendance />
          }
        />

        <Route
          path="homework"
          element={
            <ParentHomework />
          }
        />

        <Route
          path="results"
          element={
            <ParentResults />
          }
        />

        <Route
          path="notifications"
          element={
            <Notifications />
          }
        />

        <Route
          path="settings"
          element={<Settings />}
        />
      </Route>

      {/* =====================================
          ADMIN
      ===================================== */}

      <Route
        path="/admin"
        element={
          <ProtectedRoute
            allowedRoles={[
              "ADMIN",
            ]}
          >
            <PortalLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <Navigate
              to="dashboard"
              replace
            />
          }
        />

        <Route
          path="dashboard"
          element={
            <AdminDashboard />
          }
        />

        <Route
          path="students"
          element={<Students />}
        />

        <Route
          path="teachers"
          element={
            <AdminTeachers />
          }
        />

        <Route
          path="classes"
          element={
            <GradesSubjects />
          }
        />

        <Route
          path="timetable"
          element={<Timetable />}
        />

        <Route
          path="attendance"
          element={
            <AdminAttendance />
          }
        />

        <Route
          path="notices"
          element={<Notices />}
        />

        <Route
          path="applications"
          element={<Applications />}
        />

        <Route
          path="settings"
          element={<Settings />}
        />
      </Route>

      {/* =====================================
          UNAUTHORIZED
      ===================================== */}

      <Route
        path="/unauthorized"
        element={
          <div className="center-page">
            <h1>
              Access Denied
            </h1>

            <p>
              You don't have
              permission to view this
              page.
            </p>
          </div>
        }
      />

      {/* =====================================
          404
      ===================================== */}

      <Route
        path="*"
        element={
          <div className="center-page">
            <h1>404</h1>

            <p>
              Page not found.
            </p>
          </div>
        }
      />
    </Routes>
  );
}