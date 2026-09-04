import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  GraduationCap,
  UserMinus,
  Users,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const EMPTY_SUMMARY = {
  total: 0,
  PRESENT: 0,
  ABSENT: 0,
  LATE: 0,
  EXCUSED: 0,
  attendanceRate: 0,
};

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      year: "numeric",
      month: "short",
      day: "2-digit",
      timeZone: "UTC",
    }
  ).format(new Date(value));
}

function statusLabel(status) {
  const labels = {
    PRESENT: "Present",
    ABSENT: "Absent",
    LATE: "Late",
    EXCUSED: "Excused",
  };

  return labels[status] || status;
}

export default function Attendance() {
  const [
    children,
    setChildren,
  ] = useState([]);

  const [
    selectedStudentId,
    setSelectedStudentId,
  ] = useState("");

  const [
    student,
    setStudent,
  ] = useState(null);

  const [
    records,
    setRecords,
  ] = useState([]);

  const [
    summary,
    setSummary,
  ] = useState(EMPTY_SUMMARY);

  const [
    loadingChildren,
    setLoadingChildren,
  ] = useState(true);

  const [
    loadingAttendance,
    setLoadingAttendance,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* ========================================
     LOAD LINKED CHILDREN
  ======================================== */

  async function loadChildren() {
    try {
      setLoadingChildren(true);
      setError("");

      const response =
        await fetch(
          `${API_URL}/attendance/parent/children`,
          {
            credentials: "include",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load children."
        );
      }

      const linkedChildren =
        Array.isArray(data.children)
          ? data.children
          : [];

      setChildren(
        linkedChildren
      );

      if (
        linkedChildren.length > 0
      ) {
        setSelectedStudentId(
          String(
            linkedChildren[0].id
          )
        );
      } else {
        setSelectedStudentId(
          ""
        );

        setStudent(null);
        setRecords([]);
        setSummary(
          EMPTY_SUMMARY
        );
      }
    } catch (err) {
      console.error(err);

      setChildren([]);
      setSelectedStudentId(
        ""
      );

      setStudent(null);
      setRecords([]);
      setSummary(
        EMPTY_SUMMARY
      );

      setError(
        err.message ||
          "Unable to load linked children."
      );
    } finally {
      setLoadingChildren(
        false
      );
    }
  }

  useEffect(() => {
    loadChildren();
  }, []);

  /* ========================================
     LOAD CHILD ATTENDANCE
  ======================================== */

  async function loadAttendance(
    studentId
  ) {
    if (!studentId) {
      setStudent(null);
      setRecords([]);
      setSummary(
        EMPTY_SUMMARY
      );

      return;
    }

    try {
      setLoadingAttendance(
        true
      );

      setError("");

      /*
       * Clear old child's data while
       * loading the selected child.
       */

      setStudent(null);
      setRecords([]);
      setSummary(
        EMPTY_SUMMARY
      );

      const response =
        await fetch(
          `${API_URL}/attendance/parent/child/${studentId}`,
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
            "Unable to load attendance."
        );
      }

      setStudent(
        data.student || null
      );

      setRecords(
        Array.isArray(
          data.records
        )
          ? data.records
          : []
      );

      setSummary({
        ...EMPTY_SUMMARY,
        ...(data.summary || {}),
      });
    } catch (err) {
      console.error(err);

      setStudent(null);
      setRecords([]);
      setSummary(
        EMPTY_SUMMARY
      );

      setError(
        err.message ||
          "Unable to load attendance."
      );
    } finally {
      setLoadingAttendance(
        false
      );
    }
  }

  useEffect(() => {
    if (
      selectedStudentId
    ) {
      loadAttendance(
        selectedStudentId
      );
    } else {
      setStudent(null);
      setRecords([]);
      setSummary(
        EMPTY_SUMMARY
      );
    }
  }, [selectedStudentId]);

  /* ========================================
     SELECTED CHILD
  ======================================== */

  const selectedChild =
    useMemo(() => {
      return children.find(
        (child) =>
          child.id ===
          Number(
            selectedStudentId
          )
      );
    }, [
      children,
      selectedStudentId,
    ]);

  /* ========================================
     DISPLAY NAME
  ======================================== */

  const childName =
    student?.name ||
    selectedChild?.name ||
    "Student";

  /* ========================================
     UI
  ======================================== */

  return (
    <div className="parent-attendance-page">
      <div className="page-header">
        <div>
          <h1>
            Attendance
          </h1>

          <p>
            View your child&apos;s
            attendance history and
            overall attendance.
          </p>
        </div>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* ==================================
          CHILD SELECTOR
      ================================== */}

      <div className="parent-child-card">
        <div className="parent-child-select">
          <div className="form-group">
            <label>
              Child
            </label>

            <select
              value={
                selectedStudentId
              }
              onChange={(
                event
              ) =>
                setSelectedStudentId(
                  event.target
                    .value
                )
              }
              disabled={
                loadingChildren ||
                children.length ===
                  0
              }
            >
              <option value="">
                {loadingChildren
                  ? "Loading..."
                  : children.length ===
                      0
                    ? "No children available"
                    : "Select child"}
              </option>

              {children.map(
                (child) => (
                  <option
                    key={
                      child.id
                    }
                    value={
                      child.id
                    }
                  >
                    {child.name ||
                      "Unnamed Student"}

                    {child.grade
                      ? ` - ${child.grade.name}`
                      : " - No KTN class"}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {selectedChild && (
          <div className="parent-child-summary">
            <div className="parent-child-avatar">
              {childName
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <h2>
                {childName}
              </h2>

              <p>
                {selectedChild.admissionNumber ||
                  "No admission number"}

                {selectedChild.grade
                  ? ` • ${selectedChild.grade.name}`
                  : " • KTN class not assigned"}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ==================================
          SUMMARY
      ================================== */}

      <div className="parent-attendance-summary">
        <div className="parent-attendance-stat">
          <div className="parent-stat-icon">
            <Users size={20} />
          </div>

          <div>
            <span>
              Total Records
            </span>

            <strong>
              {summary.total}
            </strong>
          </div>
        </div>

        <div className="parent-attendance-stat present">
          <div className="parent-stat-icon">
            <CheckCircle2
              size={20}
            />
          </div>

          <div>
            <span>
              Present
            </span>

            <strong>
              {summary.PRESENT}
            </strong>
          </div>
        </div>

        <div className="parent-attendance-stat absent">
          <div className="parent-stat-icon">
            <UserMinus
              size={20}
            />
          </div>

          <div>
            <span>
              Absent
            </span>

            <strong>
              {summary.ABSENT}
            </strong>
          </div>
        </div>

        <div className="parent-attendance-stat late">
          <div className="parent-stat-icon">
            <Clock3
              size={20}
            />
          </div>

          <div>
            <span>
              Late
            </span>

            <strong>
              {summary.LATE}
            </strong>
          </div>
        </div>

        <div className="parent-attendance-stat excused">
          <div className="parent-stat-icon">
            <CalendarDays
              size={20}
            />
          </div>

          <div>
            <span>
              Excused
            </span>

            <strong>
              {summary.EXCUSED}
            </strong>
          </div>
        </div>

        <div className="parent-attendance-stat rate">
          <div className="parent-stat-icon">
            <GraduationCap
              size={20}
            />
          </div>

          <div>
            <span>
              Attendance Rate
            </span>

            <strong>
              {summary.attendanceRate}%
            </strong>
          </div>
        </div>
      </div>

      {/* ==================================
          HISTORY
      ================================== */}

      <div className="parent-attendance-history-card">
        <div className="parent-attendance-history-header">
          <div>
            <h2>
              Attendance History
            </h2>

            <p>
              Attendance recorded
              by your child&apos;s
              teachers.
            </p>
          </div>
        </div>

        <div className="students-table-wrapper">
          <table className="students-table parent-attendance-table">
            <thead>
              <tr>
                <th>
                  Date
                </th>

                <th>
                  Grade
                </th>

                <th>
                  Subject
                </th>

                <th>
                  Teacher
                </th>

                <th>
                  Time
                </th>

                <th>
                  Status
                </th>

                <th>
                  Note
                </th>
              </tr>
            </thead>

            <tbody>
              {loadingAttendance ? (
                <tr>
                  <td
                    colSpan="7"
                    className="empty-table"
                  >
                    Loading
                    attendance...
                  </td>
                </tr>
              ) : !selectedStudentId ? (
                <tr>
                  <td
                    colSpan="7"
                    className="empty-table"
                  >
                    Select a child
                    to view
                    attendance.
                  </td>
                </tr>
              ) : records.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="empty-table"
                  >
                    No attendance
                    records are
                    available for
                    this child yet.
                  </td>
                </tr>
              ) : (
                records.map(
                  (record) => {
                    const classInfo =
                      record
                        .attendanceSession
                        ?.timetableEntry;

                    if (
                      !classInfo
                    ) {
                      return null;
                    }

                    return (
                      <tr
                        key={
                          record.id
                        }
                      >
                        <td>
                          <strong>
                            {formatDate(
                              record
                                .attendanceSession
                                .attendanceDate
                            )}
                          </strong>

                          <div className="parent-attendance-day">
                            {classInfo.dayOfWeek ||
                              "—"}
                          </div>
                        </td>

                        <td>
                          {classInfo
                            .grade
                            ?.name ||
                            "—"}
                        </td>

                        <td>
                          {classInfo
                            .subject
                            ?.name ||
                            "—"}
                        </td>

                        <td>
                          {classInfo
                            .teacher
                            ?.user
                            ?.name ||
                            "—"}
                        </td>

                        <td>
                          {classInfo.startTime ||
                            "—"}

                          {" - "}

                          {classInfo.endTime ||
                            "—"}
                        </td>

                        <td>
                          <span
                            className={`parent-attendance-status ${record.status
                              .toLowerCase()}`}
                          >
                            {statusLabel(
                              record.status
                            )}
                          </span>
                        </td>

                        <td>
                          {record.note ||
                            "—"}
                        </td>
                      </tr>
                    );
                  }
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}