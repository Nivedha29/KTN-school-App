import { useEffect, useMemo, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

function formatDate(dateString) {
  if (!dateString) return "No due date";

  const date = new Date(dateString);

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function getDateInputValue(dateString) {
  if (!dateString) return "";

  const date = new Date(dateString);

  const year = date.getUTCFullYear();
  const month = String(
    date.getUTCMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getUTCDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function Homework() {
  const [subjects, setSubjects] = useState([]);
  const [homework, setHomework] = useState([]);

  const [subjectId, setSubjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] =
    useState("");
  const [dueDate, setDueDate] = useState("");

  const [editingId, setEditingId] =
    useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedSubject = useMemo(
    () =>
      subjects.find(
        (subject) =>
          String(subject.subjectId) ===
          String(subjectId)
      ),
    [subjects, subjectId]
  );

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [subjectsResponse, homeworkResponse] =
        await Promise.all([
          fetch(
            `${API_BASE}/homework/teacher/subjects`,
            {
              credentials: "include",
            }
          ),
          fetch(`${API_BASE}/homework/teacher`, {
            credentials: "include",
          }),
        ]);

      const subjectsData =
        await subjectsResponse.json();
      const homeworkData =
        await homeworkResponse.json();

      if (!subjectsResponse.ok) {
        throw new Error(
          subjectsData.message ||
            "Failed to load assigned subjects."
        );
      }

      if (!homeworkResponse.ok) {
        throw new Error(
          homeworkData.message ||
            "Failed to load homework."
        );
      }

      const loadedSubjects = Array.isArray(
        subjectsData.subjects
      )
        ? subjectsData.subjects
        : [];

      setSubjects(loadedSubjects);

      setHomework(
        Array.isArray(homeworkData.homework)
          ? homeworkData.homework
          : []
      );

      if (
        loadedSubjects.length > 0 &&
        !subjectId
      ) {
        setSubjectId(
          String(
            loadedSubjects[0].subjectId
          )
        );
      }
    } catch (err) {
      setError(
        err.message ||
          "Unable to load homework."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setDueDate("");

    if (subjects.length > 0) {
      setSubjectId(
        String(subjects[0].subjectId)
      );
    } else {
      setSubjectId("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!subjectId) {
      setError("Please select a subject.");
      return;
    }

    if (!title.trim()) {
      setError(
        "Please enter a homework title."
      );
      return;
    }

    if (!description.trim()) {
      setError(
        "Please enter homework instructions."
      );
      return;
    }

    try {
      setSaving(true);

      const url = editingId
        ? `${API_BASE}/homework/teacher/${editingId}`
        : `${API_BASE}/homework/teacher`;

      const response = await fetch(url, {
        method: editingId ? "PUT" : "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify({
          subjectId: Number(subjectId),
          title: title.trim(),
          description:
            description.trim(),
          dueDate: dueDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to save homework."
        );
      }

      setMessage(
        editingId
          ? "Homework updated successfully."
          : "Homework created successfully."
      );

      resetForm();
      await loadData();
    } catch (err) {
      setError(
        err.message ||
          "Failed to save homework."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(item) {
    setEditingId(item.id);
    setSubjectId(
      String(item.subjectId)
    );
    setTitle(item.title);
    setDescription(item.description);
    setDueDate(
      getDateInputValue(item.dueDate)
    );

    setMessage("");
    setError("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(
      `Remove "${item.title}"?`
    );

    if (!confirmed) return;

    try {
      setMessage("");
      setError("");

      const response = await fetch(
        `${API_BASE}/homework/teacher/${item.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to remove homework."
        );
      }

      if (editingId === item.id) {
        resetForm();
      }

      setMessage(
        "Homework removed successfully."
      );

      await loadData();
    } catch (err) {
      setError(
        err.message ||
          "Failed to remove homework."
      );
    }
  }

  if (loading) {
    return (
      <div className="dashboard-card">
        <h1>Homework</h1>
        <p>Loading homework...</p>
      </div>
    );
  }

  return (
    <div className="portal-page">
      <div className="portal-page-header">
        <div>
          <h1>Homework</h1>
          <p>
            Create and manage homework for
            your assigned classes.
          </p>
        </div>
      </div>

      {message && (
        <div className="portal-alert success">
          {message}
        </div>
      )}

      {error && (
        <div className="portal-alert error">
          {error}
        </div>
      )}

      <div className="dashboard-card">
        <div className="card-heading-row">
          <div>
            <h2>
              {editingId
                ? "Edit Homework"
                : "Create Homework"}
            </h2>

            <p>
              Homework can only be assigned
              to subjects currently assigned
              to you.
            </p>
          </div>

          <BookOpen size={24} />
        </div>

        {subjects.length === 0 ? (
          <div className="empty-state">
            <p>
              No subjects are currently
              assigned to you.
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="portal-form"
          >
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="subject">
                  Class / Subject
                </label>

                <select
                  id="subject"
                  value={subjectId}
                  onChange={(event) =>
                    setSubjectId(
                      event.target.value
                    )
                  }
                  required
                >
                  {subjects.map(
                    (subject) => (
                      <option
                        key={
                          subject.assignmentId
                        }
                        value={
                          subject.subjectId
                        }
                      >
                        {subject.gradeName} -{" "}
                        {
                          subject.subjectName
                        }
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="dueDate">
                  Due Date
                </label>

                <input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(event) =>
                    setDueDate(
                      event.target.value
                    )
                  }
                />
              </div>
            </div>

            {selectedSubject && (
              <div className="form-helper">
                Selected:{" "}
                <strong>
                  {
                    selectedSubject.gradeName
                  }{" "}
                  -{" "}
                  {
                    selectedSubject.subjectName
                  }
                </strong>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="title">
                Homework Title
              </label>

              <input
                id="title"
                type="text"
                value={title}
                onChange={(event) =>
                  setTitle(
                    event.target.value
                  )
                }
                placeholder="Example: Fractions practice"
                maxLength={200}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">
                Instructions
              </label>

              <textarea
                id="description"
                value={description}
                onChange={(event) =>
                  setDescription(
                    event.target.value
                  )
                }
                placeholder="Enter the homework instructions..."
                rows={5}
                required
              />
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="portal-button primary"
                disabled={saving}
              >
                {editingId ? (
                  <Pencil size={18} />
                ) : (
                  <Plus size={18} />
                )}

                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Homework"
                  : "Create Homework"}
              </button>

              {editingId && (
                <button
                  type="button"
                  className="portal-button secondary"
                  onClick={resetForm}
                  disabled={saving}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      <div className="dashboard-card">
        <div className="card-heading-row">
          <div>
            <h2>Assigned Homework</h2>
            <p>
              Active homework created by
              you.
            </p>
          </div>

          <CalendarDays size={24} />
        </div>

        {homework.length === 0 ? (
          <div className="empty-state">
            <p>
              No homework has been created
              yet.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="portal-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Subject</th>
                  <th>Homework</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {homework.map((item) => (
                  <tr key={item.id}>
                    <td>
                      {item.grade?.name ||
                        "-"}
                    </td>

                    <td>
                      {item.subject?.name ||
                        "-"}
                    </td>

                    <td>
                      <div className="homework-title">
                        <strong>
                          {item.title}
                        </strong>

                        <p>
                          {
                            item.description
                          }
                        </p>
                      </div>
                    </td>

                    <td>
                      {formatDate(
                        item.dueDate
                      )}
                    </td>

                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="icon-button"
                          title="Edit homework"
                          onClick={() =>
                            handleEdit(item)
                          }
                        >
                          <Pencil
                            size={17}
                          />
                        </button>

                        <button
                          type="button"
                          className="icon-button danger"
                          title="Remove homework"
                          onClick={() =>
                            handleDelete(item)
                          }
                        >
                          <Trash2
                            size={17}
                          />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}