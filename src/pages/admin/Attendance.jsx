import {
  Fragment,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Eye,
  GraduationCap,
  RefreshCw,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

function formatDate(value) {
  if (!value) return "—";

  return new Intl.DateTimeFormat("en-GB", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
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
  const [grades, setGrades] = useState([]);
  const [sessions, setSessions] = useState([]);

  const [summary, setSummary] = useState({
    sessions: 0,
    records: 0,
    PRESENT: 0,
    ABSENT: 0,
    LATE: 0,
    EXCUSED: 0,
  });

  const [selectedDate, setSelectedDate] =
    useState("");

  const [selectedGradeId, setSelectedGradeId] =
    useState("");

  const [expandedSessionId, setExpandedSessionId] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ========================================
  // LOAD GRADES
  // ========================================

  async function loadGrades() {
    try {
      const response = await fetch(
        `${API_URL}/academic/grades`,
        {
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load grades."
        );
      }

      setGrades(data.grades || []);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to load grades."
      );
    }
  }

  // ========================================
  // LOAD ATTENDANCE
  // ========================================

  async function loadAttendance() {
    try {
      setLoading(true);
      setError("");

      const params = new URLSearchParams();

      if (selectedDate) {
        params.set("date", selectedDate);
      }

      if (selectedGradeId) {
        params.set(
          "gradeId",
          selectedGradeId
        );
      }

      const query = params.toString();

      const url =
        `${API_URL}/attendance/admin/overview${
          query ? `?${query}` : ""
        }`;

      console.log(
        "ADMIN ATTENDANCE REQUEST:",
        url
      );

      const response = await fetch(url, {
        credentials: "include",
      });

      const data = await response.json();

      console.log(
        "ADMIN ATTENDANCE RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load attendance overview."
        );
      }

      setSessions(
        Array.isArray(data.sessions)
          ? data.sessions
          : []
      );

      setSummary({
        sessions:
          data.summary?.sessions ?? 0,

        records:
          data.summary?.records ?? 0,

        PRESENT:
          data.summary?.PRESENT ?? 0,

        ABSENT:
          data.summary?.ABSENT ?? 0,

        LATE:
          data.summary?.LATE ?? 0,

        EXCUSED:
          data.summary?.EXCUSED ?? 0,
      });

      setExpandedSessionId(null);
    } catch (err) {
      console.error(
        "ADMIN ATTENDANCE ERROR:",
        err
      );

      setSessions([]);

      setSummary({
        sessions: 0,
        records: 0,
        PRESENT: 0,
        ABSENT: 0,
        LATE: 0,
        EXCUSED: 0,
      });

      setError(
        err.message ||
          "Unable to load attendance overview."
      );
    } finally {
      setLoading(false);
    }
  }

  // ========================================
  // INITIAL LOAD
  // ========================================

  useEffect(() => {
    loadGrades();
  }, []);

  useEffect(() => {
    loadAttendance();
  }, [selectedDate, selectedGradeId]);

  // ========================================
  // ATTENDANCE RATE
  // Present + Late = attended
  // ========================================

  const attendanceRate = useMemo(() => {
    if (!summary.records) {
      return 0;
    }

    const attended =
      summary.PRESENT + summary.LATE;

    return Math.round(
      (attended / summary.records) * 100
    );
  }, [summary]);

  // ========================================
  // FILTER ACTIONS
  // ========================================

  function clearFilters() {
    setSelectedDate("");
    setSelectedGradeId("");
  }

  function toggleSession(sessionId) {
    setExpandedSessionId((current) =>
      current === sessionId
        ? null
        : sessionId
    );
  }

  // ========================================
  // UI
  // ========================================

  return (
    <div className="admin-attendance-page">
      {/* PAGE HEADER */}

      <div className="page-header">
        <div>
          <h1>Attendance Overview</h1>

          <p>
            Review attendance recorded by
            teachers across all grades and
            subjects.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={loadAttendance}
          disabled={loading}
        >
          <RefreshCw size={17} />

          {loading
            ? "Loading..."
            : "Refresh"}
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* FILTERS */}

      <div className="admin-attendance-filter-card">
        <div className="admin-attendance-filters">
          <div className="form-group">
            <label>
              Attendance Date
            </label>

            <input
              type="date"
              value={selectedDate}
              onChange={(event) =>
                setSelectedDate(
                  event.target.value
                )
              }
            />
          </div>

          <div className="form-group">
            <label>Grade</label>

            <select
              value={selectedGradeId}
              onChange={(event) =>
                setSelectedGradeId(
                  event.target.value
                )
              }
            >
              <option value="">
                All Grades
              </option>

              {grades.map((grade) => (
                <option
                  key={grade.id}
                  value={grade.id}
                >
                  {grade.name}
                </option>
              ))}
            </select>
          </div>

          <div className="attendance-filter-action">
            <button
              type="button"
              className="secondary-button"
              onClick={clearFilters}
              disabled={
                !selectedDate &&
                !selectedGradeId
              }
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* SUMMARY */}

      <div className="admin-attendance-summary">
        <div className="admin-attendance-stat">
          <div className="attendance-stat-icon">
            <CalendarDays size={20} />
          </div>

          <div>
            <span>Sessions</span>
            <strong>
              {summary.sessions}
            </strong>
          </div>
        </div>

        <div className="admin-attendance-stat">
          <div className="attendance-stat-icon">
            <Users size={20} />
          </div>

          <div>
            <span>
              Student Records
            </span>

            <strong>
              {summary.records}
            </strong>
          </div>
        </div>

        <div className="admin-attendance-stat present">
          <div className="attendance-stat-icon">
            <CheckCircle2 size={20} />
          </div>

          <div>
            <span>Present</span>

            <strong>
              {summary.PRESENT}
            </strong>
          </div>
        </div>

        <div className="admin-attendance-stat absent">
          <div className="attendance-stat-icon">
            <UserMinus size={20} />
          </div>

          <div>
            <span>Absent</span>

            <strong>
              {summary.ABSENT}
            </strong>
          </div>
        </div>

        <div className="admin-attendance-stat late">
          <div className="attendance-stat-icon">
            <Clock3 size={20} />
          </div>

          <div>
            <span>Late</span>

            <strong>
              {summary.LATE}
            </strong>
          </div>
        </div>

        <div className="admin-attendance-stat">
          <div className="attendance-stat-icon">
            <UserCheck size={20} />
          </div>

          <div>
            <span>
              Attendance Rate
            </span>

            <strong>
              {attendanceRate}%
            </strong>
          </div>
        </div>
      </div>

      {/* SESSION TABLE */}

      <div className="admin-attendance-table-card">
        <div className="admin-attendance-table-title">
          <div>
            <h2>
              Attendance Sessions
            </h2>

            <p>
              Click View Students to
              inspect the attendance
              recorded for a class.
            </p>
          </div>

          <span className="attendance-session-count">
            {sessions.length} session
            {sessions.length === 1
              ? ""
              : "s"}
          </span>
        </div>

        <div className="students-table-wrapper">
          <table className="students-table admin-attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Grade</th>
                <th>Subject</th>
                <th>Teacher</th>
                <th>Time</th>
                <th>Attendance</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="empty-table"
                  >
                    Loading attendance...
                  </td>
                </tr>
              ) : sessions.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="empty-table"
                  >
                    No attendance records
                    found for the selected
                    filters.
                  </td>
                </tr>
              ) : (
                sessions.map(
                  (session) => (
                    <Fragment
                      key={session.id}
                    >
                      {/* SESSION */}

                      <tr>
                        <td>
                          <strong>
                            {formatDate(
                              session.attendanceDate
                            )}
                          </strong>

                          <div className="attendance-day-label">
                            {
                              session
                                .timetableEntry
                                .dayOfWeek
                            }
                          </div>
                        </td>

                        <td>
                          <span className="attendance-grade-badge">
                            <GraduationCap
                              size={14}
                            />

                            {
                              session
                                .timetableEntry
                                .grade.name
                            }
                          </span>
                        </td>

                        <td>
                          {
                            session
                              .timetableEntry
                              .subject.name
                          }
                        </td>

                        <td>
                          {
                            session
                              .timetableEntry
                              .teacher.user
                              .name
                          }
                        </td>

                        <td>
                          {
                            session
                              .timetableEntry
                              .startTime
                          }
                          {" - "}
                          {
                            session
                              .timetableEntry
                              .endTime
                          }
                        </td>

                        <td>
                          <div className="attendance-mini-summary">
                            <span className="mini-present">
                              P{" "}
                              {session
                                .counts
                                ?.PRESENT ??
                                0}
                            </span>

                            <span className="mini-absent">
                              A{" "}
                              {session
                                .counts
                                ?.ABSENT ??
                                0}
                            </span>

                            <span className="mini-late">
                              L{" "}
                              {session
                                .counts
                                ?.LATE ??
                                0}
                            </span>

                            <span className="mini-excused">
                              E{" "}
                              {session
                                .counts
                                ?.EXCUSED ??
                                0}
                            </span>
                          </div>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="attendance-view-button"
                            onClick={() =>
                              toggleSession(
                                session.id
                              )
                            }
                          >
                            <Eye
                              size={15}
                            />

                            {expandedSessionId ===
                            session.id
                              ? "Hide Students"
                              : "View Students"}
                          </button>
                        </td>
                      </tr>

                      {/* STUDENT DETAILS */}

                      {expandedSessionId ===
                        session.id && (
                        <tr className="attendance-details-row">
                          <td colSpan="7">
                            <div className="attendance-session-details">
                              <div className="attendance-session-details-header">
                                <div>
                                  <h3>
                                    {
                                      session
                                        .timetableEntry
                                        .grade
                                        .name
                                    }
                                    {" - "}
                                    {
                                      session
                                        .timetableEntry
                                        .subject
                                        .name
                                    }
                                  </h3>

                                  <p>
                                    {session.totalStudents ??
                                      session
                                        .records
                                        ?.length ??
                                      0}{" "}
                                    student
                                    record
                                    {(session.totalStudents ??
                                      session
                                        .records
                                        ?.length ??
                                      0) ===
                                    1
                                      ? ""
                                      : "s"}
                                  </p>
                                </div>
                              </div>

                              <div className="attendance-student-list">
                                {!session
                                  .records
                                  ?.length ? (
                                  <div className="empty-table">
                                    No
                                    student
                                    attendance
                                    records.
                                  </div>
                                ) : (
                                  session.records.map(
                                    (
                                      record
                                    ) => (
                                      <div
                                        className="attendance-student-row"
                                        key={
                                          record.id
                                        }
                                      >
                                        <div className="attendance-student-info">
                                          <div className="student-avatar">
                                            {record.student.user.name
                                              .charAt(
                                                0
                                              )
                                              .toUpperCase()}
                                          </div>

                                          <div>
                                            <strong>
                                              {
                                                record
                                                  .student
                                                  .user
                                                  .name
                                              }
                                            </strong>

                                            <span>
                                              {record
                                                .student
                                                .admissionNumber ||
                                                "No admission number"}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="attendance-record-right">
                                          <span
                                            className={`attendance-record-status ${record.status.toLowerCase()}`}
                                          >
                                            {statusLabel(
                                              record.status
                                            )}
                                          </span>

                                          {record.note && (
                                            <span className="attendance-record-note">
                                              {
                                                record.note
                                              }
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )
                                  )
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}