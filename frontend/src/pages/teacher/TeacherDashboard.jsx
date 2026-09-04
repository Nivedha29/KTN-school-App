import {
  BookOpen,
  ClipboardCheck,
  FileCheck,
  Users,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useNavigate,
} from "react-router-dom";

import {
  useAuth,
} from "../../context/AuthContext";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

function getTodayName() {
  return new Intl.DateTimeFormat(
    "en-US",
    {
      weekday: "long",
    }
  ).format(new Date());
}

export default function TeacherDashboard() {
  const { user } = useAuth();

  const navigate =
    useNavigate();

  const [
    classes,
    setClasses,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  /* ========================================
     LOAD TEACHER CLASSES
  ======================================== */

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API_BASE}/attendance/my-classes`,
            {
              credentials:
                "include",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load teacher dashboard."
          );
        }

        setClasses(
          Array.isArray(
            data.classes
          )
            ? data.classes
            : []
        );
      } catch (err) {
        console.error(err);

        setClasses([]);

        setError(
          err.message ||
            "Unable to load teacher dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  /* ========================================
     TODAY'S CLASSES
  ======================================== */

  const todayName =
    getTodayName();

  const todayClasses =
    useMemo(() => {
      return classes
        .filter(
          (item) =>
            String(
              item.dayOfWeek
            ).toLowerCase() ===
            todayName.toLowerCase()
        )
        .sort((a, b) =>
          String(
            a.startTime
          ).localeCompare(
            String(
              b.startTime
            )
          )
        );
    }, [
      classes,
      todayName,
    ]);

  /* ========================================
     UNIQUE GRADES
  ======================================== */

  const uniqueGrades =
    useMemo(() => {
      const gradeIds =
        new Set();

      classes.forEach(
        (item) => {
          if (
            item.grade?.id
          ) {
            gradeIds.add(
              item.grade.id
            );
          }
        }
      );

      return gradeIds.size;
    }, [classes]);

  return (
    <div>
      {/* ==================================
          HEADER
      ================================== */}

      <section className="dashboard-heading">
        <p className="eyebrow">
          TEACHER PORTAL
        </p>

        <h1>
          Welcome,{" "}
          {user?.name ||
            "Teacher"}{" "}
          👋
        </h1>

        <p>
          Manage your classes,
          attendance, homework,
          and student results from
          one place.
        </p>
      </section>

      {/* ERROR */}

      {error && (
        <div className="portal-alert error">
          {error}
        </div>
      )}

      {/* ==================================
          DASHBOARD STATS
      ================================== */}

      <section className="stat-grid">
        <TeacherStat
          icon={BookOpen}
          value={
            loading
              ? "..."
              : todayClasses.length
          }
          title="Classes Today"
        />

        <TeacherStat
          icon={Users}
          value={
            loading
              ? "..."
              : uniqueGrades
          }
          title="Assigned Classes"
        />

        <TeacherStat
          icon={FileCheck}
          value="—"
          title="Results Pending"
        />

        <TeacherStat
          icon={
            ClipboardCheck
          }
          value="—"
          title="Absent Today"
        />
      </section>

      {/* ==================================
          MAIN DASHBOARD
      ================================== */}

      <section className="dashboard-grid">
        {/* TODAY'S CLASSES */}

        <div className="dashboard-card">
          <h2>
            Today&apos;s Classes
          </h2>

          {loading ? (
            <div className="empty-state">
              Loading classes...
            </div>
          ) : todayClasses.length ===
            0 ? (
            <div className="empty-state">
              No classes scheduled
              for today.
            </div>
          ) : (
            todayClasses.map(
              (item) => (
                <ClassRow
                  key={
                    item.id
                  }
                  subject={
                    item.subject
                      ?.name ||
                    "Subject"
                  }
                  grade={
                    item.grade
                      ?.name ||
                    "Grade"
                  }
                  time={
                    item.startTime
                      ? `${item.startTime}${
                          item.endTime
                            ? ` - ${item.endTime}`
                            : ""
                        }`
                      : "—"
                  }
                />
              )
            )
          )}
        </div>

        {/* QUICK ACTIONS */}

        <div className="dashboard-card">
          <h2>
            Quick Actions
          </h2>

          <div className="quick-actions">
            <button
              type="button"
              onClick={() =>
                navigate(
                  "/teacher/homework"
                )
              }
            >
              + Create Homework
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/teacher/attendance"
                )
              }
            >
              + Take Attendance
            </button>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/teacher/results"
                )
              }
            >
              + Enter Results
            </button>

            <button
              type="button"
              disabled
              title="Learning materials module is not available yet"
            >
              + Upload Material
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function TeacherStat({
  icon: Icon,
  value,
  title,
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        <Icon />
      </div>

      <div>
        <strong>
          {value}
        </strong>

        <span>
          {title}
        </span>
      </div>
    </div>
  );
}

function ClassRow({
  subject,
  grade,
  time,
}) {
  return (
    <div className="class-row">
      <div>
        <strong>
          {subject}
        </strong>

        <span>
          {grade}
        </span>
      </div>

      <strong>
        {time}
      </strong>
    </div>
  );
}