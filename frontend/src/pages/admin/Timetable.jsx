import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  CalendarDays,
  Clock,
  Trash2,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

const emptyForm = {
  gradeId: "",
  subjectId: "",
  teacherId: "",
  dayOfWeek: "",
  startTime: "",
  endTime: "",
  room: "",
};

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export default function Timetable() {
  const [entries, setEntries] = useState([]);
  const [grades, setGrades] = useState([]);
  const [teachers, setTeachers] = useState([]);

  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadTimetable() {
    const response = await fetch(
      `${API_URL}/timetable`,
      {
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Unable to load timetable."
      );
    }

    setEntries(data.entries || []);
  }

  async function loadGrades() {
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
  }

  async function loadTeachers() {
    const response = await fetch(
      `${API_URL}/teachers`,
      {
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Unable to load teachers."
      );
    }

    setTeachers(data.teachers || []);
  }

  async function loadPage() {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        loadTimetable(),
        loadGrades(),
        loadTeachers(),
      ]);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to load timetable information."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, []);

  const selectedGrade = useMemo(() => {
    return grades.find(
      (grade) =>
        grade.id === Number(form.gradeId)
    );
  }, [grades, form.gradeId]);

  const availableSubjects =
    selectedGrade?.subjects || [];

  const selectedSubjectId = Number(
    form.subjectId
  );

  const availableTeachers = useMemo(() => {
    if (!selectedSubjectId) {
      return [];
    }

    return teachers.filter((teacher) => {
      const assignments =
        teacher.teacherProfile
          ?.subjectAssignments || [];

      return assignments.some(
        (assignment) =>
          assignment.subject.id ===
          selectedSubjectId
      );
    });
  }, [teachers, selectedSubjectId]);

  function handleChange(event) {
    const { name, value } = event.target;

    if (name === "gradeId") {
      setForm((current) => ({
        ...current,
        gradeId: value,
        subjectId: "",
        teacherId: "",
      }));

      return;
    }

    if (name === "subjectId") {
      setForm((current) => ({
        ...current,
        subjectId: value,
        teacherId: "",
      }));

      return;
    }

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/timetable`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            gradeId: Number(
              form.gradeId
            ),

            subjectId: Number(
              form.subjectId
            ),

            teacherId: Number(
              form.teacherId
            ),

            dayOfWeek:
              form.dayOfWeek,

            startTime:
              form.startTime,

            endTime:
              form.endTime,

            room:
              form.room || undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to create timetable entry."
        );
      }

      setMessage(
        "Timetable entry created successfully."
      );

      setForm(emptyForm);
      setShowModal(false);

      await loadTimetable();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to create timetable entry."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(entryId) {
    const confirmed = window.confirm(
      "Delete this timetable entry?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/timetable/${entryId}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to delete timetable entry."
        );
      }

      setMessage(
        "Timetable entry deleted successfully."
      );

      await loadTimetable();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to delete timetable entry."
      );
    }
  }

  const orderedEntries = useMemo(() => {
    return [...entries].sort((a, b) => {
      const dayA = DAYS.indexOf(
        a.dayOfWeek
      );

      const dayB = DAYS.indexOf(
        b.dayOfWeek
      );

      if (dayA !== dayB) {
        return dayA - dayB;
      }

      return a.startTime.localeCompare(
        b.startTime
      );
    });
  }, [entries]);

  return (
    <div className="admin-timetable-page">
      <div className="page-header">
        <div>
          <h1>Timetable</h1>

          <p>
            Manage weekly class schedules for
            each grade.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setError("");
            setMessage("");
            setForm(emptyForm);
            setShowModal(true);
          }}
        >
          <Plus size={18} />
          Add Class
        </button>
      </div>

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

      <div className="academic-summary-grid">
        <div className="academic-summary-card">
          <div>
            <span>
              Scheduled Classes
            </span>

            <strong>
              {entries.length}
            </strong>
          </div>

          <CalendarDays size={24} />
        </div>

        <div className="academic-summary-card">
          <div>
            <span>Grades</span>

            <strong>
              {grades.length}
            </strong>
          </div>

          <Clock size={24} />
        </div>
      </div>

      <div className="students-card">
        <div className="students-table-wrapper">
          <table className="students-table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Time</th>
                <th>Grade</th>
                <th>Subject</th>
                <th>Teacher</th>
                <th>Room</th>
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
                    Loading timetable...
                  </td>
                </tr>
              ) : orderedEntries.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="empty-table"
                  >
                    No timetable entries yet.
                  </td>
                </tr>
              ) : (
                orderedEntries.map(
                  (entry) => (
                    <tr key={entry.id}>
                      <td>
                        <strong>
                          {
                            entry.dayOfWeek
                          }
                        </strong>
                      </td>

                      <td>
                        <div className="timetable-time">
                          <Clock
                            size={14}
                          />

                          {
                            entry.startTime
                          }
                          {" - "}
                          {entry.endTime}
                        </div>
                      </td>

                      <td>
                        {
                          entry.grade
                            .name
                        }
                      </td>

                      <td>
                        {
                          entry.subject
                            .name
                        }
                      </td>

                      <td>
                        {
                          entry.teacher
                            .user.name
                        }
                      </td>

                      <td>
                        {entry.room ||
                          "—"}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="delete-timetable-button"
                          onClick={() =>
                            handleDelete(
                              entry.id
                            )
                          }
                        >
                          <Trash2
                            size={15}
                          />
                          Delete
                        </button>
                      </td>
                    </tr>
                  )
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div
          className="modal-overlay"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setShowModal(false);
            }
          }}
        >
          <div className="student-modal timetable-modal">
            <div className="modal-header">
              <div>
                <h2>
                  Add Timetable Entry
                </h2>

                <p>
                  Schedule a class for a
                  grade.
                </p>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setShowModal(false)
                }
              >
                ×
              </button>
            </div>

            <form
              className="student-form"
              onSubmit={handleSubmit}
            >
              <div className="form-group">
                <label>Grade</label>

                <select
                  name="gradeId"
                  value={form.gradeId}
                  onChange={
                    handleChange
                  }
                  required
                >
                  <option value="">
                    Select grade
                  </option>

                  {grades.map(
                    (grade) => (
                      <option
                        value={
                          grade.id
                        }
                        key={
                          grade.id
                        }
                      >
                        {
                          grade.name
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Subject</label>

                <select
                  name="subjectId"
                  value={
                    form.subjectId
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    !form.gradeId
                  }
                  required
                >
                  <option value="">
                    Select subject
                  </option>

                  {availableSubjects.map(
                    (subject) => (
                      <option
                        key={
                          subject.id
                        }
                        value={
                          subject.id
                        }
                      >
                        {
                          subject.name
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>Teacher</label>

                <select
                  name="teacherId"
                  value={
                    form.teacherId
                  }
                  onChange={
                    handleChange
                  }
                  disabled={
                    !form.subjectId
                  }
                  required
                >
                  <option value="">
                    Select teacher
                  </option>

                  {availableTeachers.map(
                    (teacher) => (
                      <option
                        value={
                          teacher
                            .teacherProfile
                            .id
                        }
                        key={
                          teacher.id
                        }
                      >
                        {
                          teacher.name
                        }
                      </option>
                    )
                  )}
                </select>

                {form.subjectId &&
                  availableTeachers.length ===
                    0 && (
                    <small className="field-help warning">
                      No teacher is
                      assigned to this
                      subject yet.
                    </small>
                  )}
              </div>

              <div className="form-group">
                <label>Day</label>

                <select
                  name="dayOfWeek"
                  value={
                    form.dayOfWeek
                  }
                  onChange={
                    handleChange
                  }
                  required
                >
                  <option value="">
                    Select day
                  </option>

                  {DAYS.map((day) => (
                    <option
                      value={day}
                      key={day}
                    >
                      {day}
                    </option>
                  ))}
                </select>
              </div>

              <div className="timetable-time-grid">
                <div className="form-group">
                  <label>
                    Start Time
                  </label>

                  <input
                    type="time"
                    name="startTime"
                    value={
                      form.startTime
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    End Time
                  </label>

                  <input
                    type="time"
                    name="endTime"
                    value={
                      form.endTime
                    }
                    onChange={
                      handleChange
                    }
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>
                  Room / Meeting Link
                </label>

                <input
                  name="room"
                  value={form.room}
                  onChange={
                    handleChange
                  }
                  placeholder="Optional"
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowModal(false)
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : "Add Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}