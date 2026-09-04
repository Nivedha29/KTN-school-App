import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Users,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const STATUS_OPTIONS = [
  {
    value: "PRESENT",
    label: "Present",
  },
  {
    value: "ABSENT",
    label: "Absent",
  },
  {
    value: "LATE",
    label: "Late",
  },
  {
    value: "EXCUSED",
    label: "Excused",
  },
];

function getToday() {
  return new Date()
    .toISOString()
    .slice(0, 10);
}

export default function Attendance() {
  const [
    classes,
    setClasses,
  ] = useState([]);

  const [
    students,
    setStudents,
  ] = useState([]);

  const [
    selectedClassId,
    setSelectedClassId,
  ] = useState("");

  const [
    attendanceDate,
    setAttendanceDate,
  ] = useState(getToday());

  const [
    attendance,
    setAttendance,
  ] = useState({});

  const [
    loadingClasses,
    setLoadingClasses,
  ] = useState(true);

  const [
    loadingStudents,
    setLoadingStudents,
  ] = useState(false);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  /* ========================================
     LOAD TEACHER CLASSES
  ======================================== */

  async function loadClasses() {
    try {
      setLoadingClasses(true);
      setError("");

      const response =
        await fetch(
          `${API_URL}/attendance/my-classes`,
          {
            credentials: "include",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load your classes."
        );
      }

      setClasses(
        Array.isArray(data.classes)
          ? data.classes
          : []
      );
    } catch (err) {
      console.error(err);

      setClasses([]);

      setError(
        err.message ||
          "Unable to load classes."
      );
    } finally {
      setLoadingClasses(false);
    }
  }

  useEffect(() => {
    loadClasses();
  }, []);

  /* ========================================
     SELECTED CLASS
  ======================================== */

  const selectedClass =
    useMemo(() => {
      return classes.find(
        (item) =>
          item.id ===
          Number(selectedClassId)
      );
    }, [
      classes,
      selectedClassId,
    ]);

  /* ========================================
     LOAD STUDENTS
  ======================================== */

  async function loadStudents(
    classId
  ) {
    if (!classId) {
      setStudents([]);
      setAttendance({});

      return [];
    }

    try {
      setLoadingStudents(true);
      setError("");
      setMessage("");

      /*
       * Clear previous class data.
       */

      setStudents([]);
      setAttendance({});

      const response =
        await fetch(
          `${API_URL}/attendance/class/${classId}/students`,
          {
            credentials: "include",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load students."
        );
      }

      const loadedStudents =
        Array.isArray(data.students)
          ? data.students
          : [];

      setStudents(
        loadedStudents
      );

      const initialAttendance =
        {};

      loadedStudents.forEach(
        (student) => {
          initialAttendance[
            student.id
          ] = {
            status: "PRESENT",
            note: "",
          };
        }
      );

      setAttendance(
        initialAttendance
      );

      return loadedStudents;
    } catch (err) {
      console.error(err);

      setStudents([]);
      setAttendance({});

      setError(
        err.message ||
          "Unable to load students."
      );

      return [];
    } finally {
      setLoadingStudents(false);
    }
  }

  /* ========================================
     LOAD EXISTING ATTENDANCE
  ======================================== */

  async function loadExistingAttendance(
    classId,
    date
  ) {
    if (
      !classId ||
      !date
    ) {
      return;
    }

    try {
      const response =
        await fetch(
          `${API_URL}/attendance/class/${classId}/date/${date}`,
          {
            credentials: "include",
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

      if (
        !data.session ||
        !Array.isArray(
          data.session.records
        )
      ) {
        return;
      }

      setAttendance(
        (current) => {
          const updated = {
            ...current,
          };

          data.session.records.forEach(
            (record) => {
              updated[
                record.studentId
              ] = {
                status:
                  record.status,
                note:
                  record.note ||
                  "",
              };
            }
          );

          return updated;
        }
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to load previous attendance."
      );
    }
  }

  /* ========================================
     CLASS CHANGE
  ======================================== */

  async function handleClassChange(
    event
  ) {
    const classId =
      event.target.value;

    setSelectedClassId(
      classId
    );

    setStudents([]);
    setAttendance({});
    setError("");
    setMessage("");

    if (!classId) {
      return;
    }

    await loadStudents(
      classId
    );

    await loadExistingAttendance(
      classId,
      attendanceDate
    );
  }

  /* ========================================
     DATE CHANGE
  ======================================== */

  async function handleDateChange(
    event
  ) {
    const date =
      event.target.value;

    setAttendanceDate(date);

    setError("");
    setMessage("");

    if (
      !selectedClassId
    ) {
      return;
    }

    /*
     * Reset roster to PRESENT first,
     * then overlay any previously
     * saved attendance.
     */

    await loadStudents(
      selectedClassId
    );

    await loadExistingAttendance(
      selectedClassId,
      date
    );
  }

  /* ========================================
     UPDATE ATTENDANCE
  ======================================== */

  function updateStatus(
    studentId,
    status
  ) {
    setAttendance(
      (current) => ({
        ...current,

        [studentId]: {
          ...current[
            studentId
          ],

          status,
        },
      })
    );

    setMessage("");
  }

  function updateNote(
    studentId,
    note
  ) {
    setAttendance(
      (current) => ({
        ...current,

        [studentId]: {
          ...current[
            studentId
          ],

          note,
        },
      })
    );

    setMessage("");
  }

  /* ========================================
     MARK ALL PRESENT
  ======================================== */

  function markAllPresent() {
    setAttendance(
      (current) => {
        const updated = {};

        Object.keys(
          current
        ).forEach(
          (studentId) => {
            updated[
              studentId
            ] = {
              ...current[
                studentId
              ],

              status:
                "PRESENT",
            };
          }
        );

        return updated;
      }
    );

    setMessage("");
  }

  /* ========================================
     SAVE ATTENDANCE
  ======================================== */

  async function saveAttendance() {
    if (
      !selectedClassId
    ) {
      setError(
        "Please select a class."
      );

      return;
    }

    if (
      !attendanceDate
    ) {
      setError(
        "Please select an attendance date."
      );

      return;
    }

    if (
      students.length === 0
    ) {
      setError(
        "There are no students in this class."
      );

      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const records =
        students.map(
          (student) => ({
            /*
             * student.id is the
             * StudentProfile ID.
             */

            studentId:
              student.id,

            status:
              attendance[
                student.id
              ]?.status ||
              "PRESENT",

            note:
              attendance[
                student.id
              ]?.note ||
              "",
          })
        );

      const response =
        await fetch(
          `${API_URL}/attendance`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            credentials:
              "include",

            body:
              JSON.stringify({
                timetableEntryId:
                  Number(
                    selectedClassId
                  ),

                attendanceDate,

                records,
              }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to save attendance."
        );
      }

      setMessage(
        data.message ||
          "Attendance saved successfully."
      );

      /*
       * Reload saved attendance
       * to ensure UI matches DB.
       */

      await loadExistingAttendance(
        selectedClassId,
        attendanceDate
      );
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to save attendance."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ========================================
     COUNTS
  ======================================== */

  const counts =
    useMemo(() => {
      const result = {
        PRESENT: 0,
        ABSENT: 0,
        LATE: 0,
        EXCUSED: 0,
      };

      Object.values(
        attendance
      ).forEach(
        (record) => {
          if (
            result[
              record.status
            ] !== undefined
          ) {
            result[
              record.status
            ] += 1;
          }
        }
      );

      return result;
    }, [attendance]);

  /* ========================================
     UI
  ======================================== */

  return (
    <div className="teacher-attendance-page">
      {/* PAGE HEADER */}

      <div className="page-header">
        <div>
          <h1>
            Attendance
          </h1>

          <p>
            Mark attendance for
            your scheduled classes.
          </p>
        </div>
      </div>

      {/* ALERTS */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {message && (
        <div className="success-message">
          {message}
        </div>
      )}

      {/* ==================================
          CONTROLS
      ================================== */}

      <div className="attendance-control-card">
        <div className="attendance-control-grid">
          <div className="form-group">
            <label>
              Class
            </label>

            <select
              value={
                selectedClassId
              }
              onChange={
                handleClassChange
              }
              disabled={
                loadingClasses
              }
            >
              <option value="">
                {loadingClasses
                  ? "Loading classes..."
                  : "Select class"}
              </option>

              {classes.map(
                (item) => (
                  <option
                    value={
                      item.id
                    }
                    key={
                      item.id
                    }
                  >
                    {item.grade
                      ?.name ||
                      "Grade"}{" "}
                    -{" "}
                    {item.subject
                      ?.name ||
                      "Subject"}{" "}
                    -{" "}
                    {item.dayOfWeek}{" "}
                    {item.startTime}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="form-group">
            <label>
              Attendance Date
            </label>

            <input
              type="date"
              value={
                attendanceDate
              }
              onChange={
                handleDateChange
              }
            />
          </div>
        </div>

        {selectedClass && (
          <div className="selected-class-summary">
            <div>
              <CalendarDays
                size={18}
              />

              <span>
                {selectedClass.dayOfWeek}
              </span>
            </div>

            <div>
              <Clock
                size={18}
              />

              <span>
                {selectedClass.startTime}
                {" - "}
                {selectedClass.endTime}
              </span>
            </div>

            <div>
              <Users
                size={18}
              />

              <span>
                {students.length}{" "}
                {students.length ===
                1
                  ? "student"
                  : "students"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ==================================
          ATTENDANCE SHEET
      ================================== */}

      {selectedClassId && (
        <>
          {/* SUMMARY */}

          <div className="attendance-summary-grid">
            <div className="attendance-stat-card">
              <span>
                Present
              </span>

              <strong>
                {
                  counts.PRESENT
                }
              </strong>
            </div>

            <div className="attendance-stat-card">
              <span>
                Absent
              </span>

              <strong>
                {
                  counts.ABSENT
                }
              </strong>
            </div>

            <div className="attendance-stat-card">
              <span>
                Late
              </span>

              <strong>
                {
                  counts.LATE
                }
              </strong>
            </div>

            <div className="attendance-stat-card">
              <span>
                Excused
              </span>

              <strong>
                {
                  counts.EXCUSED
                }
              </strong>
            </div>
          </div>

          {/* TABLE */}

          <div className="attendance-table-card">
            <div className="attendance-table-header">
              <div>
                <h2>
                  {selectedClass
                    ?.grade
                    ?.name ||
                    "Grade"}{" "}
                  -{" "}
                  {selectedClass
                    ?.subject
                    ?.name ||
                    "Subject"}
                </h2>

                <p>
                  {
                    attendanceDate
                  }
                </p>
              </div>

              <button
                type="button"
                className="secondary-button"
                onClick={
                  markAllPresent
                }
                disabled={
                  students.length ===
                    0 ||
                  loadingStudents
                }
              >
                <CheckCircle2
                  size={17}
                />

                Mark All Present
              </button>
            </div>

            <div className="students-table-wrapper">
              <table className="students-table attendance-table">
                <thead>
                  <tr>
                    <th>
                      Student
                    </th>

                    <th>
                      Admission No.
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
                  {loadingStudents ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="empty-table"
                      >
                        Loading
                        students...
                      </td>
                    </tr>
                  ) : students.length ===
                    0 ? (
                    <tr>
                      <td
                        colSpan="4"
                        className="empty-table"
                      >
                        No active
                        students are
                        enrolled in
                        this grade.
                      </td>
                    </tr>
                  ) : (
                    students.map(
                      (student) => {
                        const record =
                          attendance[
                            student.id
                          ] || {
                            status:
                              "PRESENT",

                            note: "",
                          };

                        const studentName =
                          student.name ||
                          "Unnamed Student";

                        return (
                          <tr
                            key={
                              student.id
                            }
                          >
                            {/* STUDENT */}

                            <td>
                              <div className="student-name-cell">
                                <div className="student-avatar">
                                  {studentName
                                    .charAt(
                                      0
                                    )
                                    .toUpperCase()}
                                </div>

                                <strong>
                                  {
                                    studentName
                                  }
                                </strong>
                              </div>
                            </td>

                            {/* ADMISSION NUMBER */}

                            <td>
                              {student.admissionNumber ||
                                "—"}
                            </td>

                            {/* STATUS */}

                            <td>
                              <div className="attendance-status-buttons">
                                {STATUS_OPTIONS.map(
                                  (
                                    option
                                  ) => (
                                    <button
                                      type="button"
                                      key={
                                        option.value
                                      }
                                      className={`attendance-status-button ${option.value.toLowerCase()} ${
                                        record.status ===
                                        option.value
                                          ? "selected"
                                          : ""
                                      }`}
                                      onClick={() =>
                                        updateStatus(
                                          student.id,
                                          option.value
                                        )
                                      }
                                    >
                                      {
                                        option.label
                                      }
                                    </button>
                                  )
                                )}
                              </div>
                            </td>

                            {/* NOTE */}

                            <td>
                              <input
                                className="attendance-note-input"
                                value={
                                  record.note
                                }
                                onChange={(
                                  event
                                ) =>
                                  updateNote(
                                    student.id,
                                    event
                                      .target
                                      .value
                                  )
                                }
                                placeholder="Optional note"
                              />
                            </td>
                          </tr>
                        );
                      }
                    )
                  )}
                </tbody>
              </table>
            </div>

            {/* SAVE */}

            <div className="attendance-save-bar">
              <button
                type="button"
                className="primary-button"
                onClick={
                  saveAttendance
                }
                disabled={
                  saving ||
                  loadingStudents ||
                  students.length ===
                    0
                }
              >
                {saving
                  ? "Saving..."
                  : "Save Attendance"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}