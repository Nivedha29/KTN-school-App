import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  Users,
  BookOpen,
  X,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

const emptyForm = {
  name: "",
  employeeNumber: "",
  email: "",
  phone: "",
  password: "",
};

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [grades, setGrades] = useState([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add Teacher
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  // Subject Assignment
  const [showSubjectModal, setShowSubjectModal] =
    useState(false);

  const [selectedTeacher, setSelectedTeacher] =
    useState(null);

  const [selectedSubjects, setSelectedSubjects] =
    useState([]);

  const [savingSubjects, setSavingSubjects] =
    useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // ========================================
  // LOAD TEACHERS
  // ========================================

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

  // ========================================
  // LOAD GRADES + SUBJECTS
  // ========================================

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

  // ========================================
  // INITIAL LOAD
  // ========================================

  async function loadPage() {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        loadTeachers(),
        loadGrades(),
      ]);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to load teacher information."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, []);

  // ========================================
  // SEARCH
  // ========================================

  const filteredTeachers = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) {
      return teachers;
    }

    return teachers.filter((teacher) => {
      const employeeNumber =
        teacher.teacherProfile?.employeeNumber ||
        "";

      return (
        teacher.name
          .toLowerCase()
          .includes(query) ||
        teacher.email
          .toLowerCase()
          .includes(query) ||
        employeeNumber
          .toLowerCase()
          .includes(query)
      );
    });
  }, [teachers, search]);

  // ========================================
  // ADD TEACHER FORM
  // ========================================

  function handleChange(event) {
    const { name, value } = event.target;

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
        `${API_URL}/teachers`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            name: form.name,
            employeeNumber:
              form.employeeNumber,
            email: form.email,
            phone:
              form.phone || undefined,
            password: form.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to create teacher."
        );
      }

      setMessage(
        "Teacher created successfully."
      );

      setForm(emptyForm);
      setShowModal(false);

      await loadTeachers();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to create teacher."
      );
    } finally {
      setSaving(false);
    }
  }

  // ========================================
  // SUBJECT ASSIGNMENT
  // ========================================

  function openSubjectAssignment(teacher) {
    const assignments =
      teacher.teacherProfile
        ?.subjectAssignments || [];

    const currentSubjectIds =
      assignments.map(
        (assignment) =>
          assignment.subject.id
      );

    setSelectedTeacher(teacher);
    setSelectedSubjects(
      currentSubjectIds
    );

    setError("");
    setMessage("");
    setShowSubjectModal(true);
  }

  function toggleSubject(subjectId) {
    setSelectedSubjects((current) => {
      if (current.includes(subjectId)) {
        return current.filter(
          (id) => id !== subjectId
        );
      }

      return [...current, subjectId];
    });
  }

  function isSubjectSelected(subjectId) {
    return selectedSubjects.includes(
      subjectId
    );
  }

  async function saveSubjectAssignments() {
    if (
      !selectedTeacher?.teacherProfile?.id
    ) {
      setError(
        "Teacher profile was not found."
      );
      return;
    }

    try {
      setSavingSubjects(true);
      setError("");
      setMessage("");

      const teacherProfileId =
        selectedTeacher.teacherProfile.id;

      const response = await fetch(
        `${API_URL}/teachers/${teacherProfileId}/subjects`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            subjectIds:
              selectedSubjects,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to save subject assignments."
        );
      }

      setShowSubjectModal(false);
      setSelectedTeacher(null);
      setSelectedSubjects([]);

      setMessage(
        "Subject assignments updated successfully."
      );

      await loadTeachers();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to save subject assignments."
      );
    } finally {
      setSavingSubjects(false);
    }
  }

  // ========================================
  // HELPERS
  // ========================================

  function getAssignments(teacher) {
    return (
      teacher.teacherProfile
        ?.subjectAssignments || []
    );
  }

  // ========================================
  // UI
  // ========================================

  return (
    <div className="admin-teachers-page">

      {/* PAGE HEADER */}

      <div className="page-header">
        <div>
          <h1>Teachers</h1>

          <p>
            Manage teacher accounts and
            subject assignments.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setError("");
            setMessage("");
            setShowModal(true);
          }}
        >
          <Plus size={18} />
          Add Teacher
        </button>
      </div>

      {/* MESSAGES */}

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

      {/* TOTAL TEACHERS */}

      <div className="stats-card">
        <div>
          <span>Total Teachers</span>
          <strong>
            {teachers.length}
          </strong>
        </div>

        <Users size={24} />
      </div>

      {/* TEACHERS TABLE */}

      <div className="students-card">
        <div className="students-toolbar">
          <div className="student-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search teachers..."
              value={search}
              onChange={(event) =>
                setSearch(
                  event.target.value
                )
              }
            />
          </div>
        </div>

        <div className="students-table-wrapper">
          <table className="students-table">
            <thead>
              <tr>
                <th>Teacher</th>
                <th>Employee No.</th>
                <th>Email</th>
                <th>Phone</th>
                <th>
                  Assigned Subjects
                </th>
                <th>Status</th>
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
                    Loading teachers...
                  </td>
                </tr>
              ) : filteredTeachers.length ===
                0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="empty-table"
                  >
                    No teachers found.
                  </td>
                </tr>
              ) : (
                filteredTeachers.map(
                  (teacher) => {
                    const profile =
                      teacher.teacherProfile;

                    const assignments =
                      getAssignments(
                        teacher
                      );

                    return (
                      <tr
                        key={teacher.id}
                      >
                        <td>
                          <div className="student-name-cell">
                            <div className="student-avatar">
                              {teacher.name
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <strong>
                              {
                                teacher.name
                              }
                            </strong>
                          </div>
                        </td>

                        <td>
                          {profile?.employeeNumber ||
                            "—"}
                        </td>

                        <td>
                          {teacher.email}
                        </td>

                        <td>
                          {profile?.phone ||
                            "—"}
                        </td>

                        <td>
                          {assignments.length ===
                          0 ? (
                            <span className="no-assignment">
                              Not assigned
                            </span>
                          ) : (
                            <div className="teacher-subject-list">
                              {assignments.map(
                                (
                                  assignment
                                ) => (
                                  <span
                                    className="teacher-subject-badge"
                                    key={
                                      assignment.id
                                    }
                                  >
                                    <BookOpen
                                      size={
                                        13
                                      }
                                    />

                                    {
                                      assignment
                                        .subject
                                        .grade
                                        .name
                                    }

                                    {" - "}

                                    {
                                      assignment
                                        .subject
                                        .name
                                    }
                                  </span>
                                )
                              )}
                            </div>
                          )}
                        </td>

                        <td>
                          <span
                            className={`status-badge ${
                              teacher.isActive
                                ? "active"
                                : "inactive"
                            }`}
                          >
                            {teacher.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="assign-subject-button"
                            onClick={() =>
                              openSubjectAssignment(
                                teacher
                              )
                            }
                          >
                            <BookOpen
                              size={15}
                            />

                            Assign Subjects
                          </button>
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

      {/* =====================================
          ADD TEACHER MODAL
      ===================================== */}

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
          <div className="student-modal">
            <div className="modal-header">
              <div>
                <h2>
                  Add Teacher
                </h2>

                <p>
                  Create a teacher
                  account for KTN
                  Digital School.
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
              onSubmit={
                handleSubmit
              }
            >
              <div className="form-group">
                <label>
                  Teacher Name
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={
                    handleChange
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Employee Number
                </label>

                <input
                  name="employeeNumber"
                  value={
                    form.employeeNumber
                  }
                  onChange={
                    handleChange
                  }
                  placeholder="KTN-T002"
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Email
                </label>

                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={
                    handleChange
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>
                  Phone
                </label>

                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={
                    handleChange
                  }
                  placeholder="Optional"
                />
              </div>

              <div className="form-group">
                <label>
                  Temporary Password
                </label>

                <input
                  type="password"
                  name="password"
                  value={
                    form.password
                  }
                  onChange={
                    handleChange
                  }
                  minLength="8"
                  required
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
                    ? "Creating..."
                    : "Create Teacher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================
          ASSIGN SUBJECTS MODAL
      ===================================== */}

      {showSubjectModal &&
        selectedTeacher && (
          <div
            className="modal-overlay"
            onMouseDown={(
              event
            ) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                setShowSubjectModal(
                  false
                );
              }
            }}
          >
            <div className="subject-assignment-modal">

              {/* HEADER */}

              <div className="modal-header">
                <div>
                  <h2>
                    Assign Subjects
                  </h2>

                  <p>
                    Select subjects for{" "}
                    <strong>
                      {
                        selectedTeacher.name
                      }
                    </strong>
                  </p>
                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={() =>
                    setShowSubjectModal(
                      false
                    )
                  }
                >
                  <X size={20} />
                </button>
              </div>

              {/* COUNT */}

              <div className="assignment-summary">
                <BookOpen
                  size={18}
                />

                <span>
                  {
                    selectedSubjects.length
                  }{" "}
                  subject
                  {selectedSubjects.length ===
                  1
                    ? ""
                    : "s"}{" "}
                  selected
                </span>
              </div>

              {/* GRADES */}

              <div className="subject-grade-list">
                {grades.map(
                  (grade) => (
                    <div
                      className="subject-grade-card"
                      key={grade.id}
                    >
                      <div className="subject-grade-title">
                        <div>
                          <strong>
                            {
                              grade.name
                            }
                          </strong>

                          <span>
                            {
                              grade
                                .subjects
                                .length
                            }{" "}
                            subjects
                          </span>
                        </div>
                      </div>

                      <div className="subject-checkbox-grid">
                        {grade.subjects.map(
                          (
                            subject
                          ) => (
                            <label
                              className={`subject-checkbox ${
                                isSubjectSelected(
                                  subject.id
                                )
                                  ? "selected"
                                  : ""
                              }`}
                              key={
                                subject.id
                              }
                            >
                              <input
                                type="checkbox"
                                checked={isSubjectSelected(
                                  subject.id
                                )}
                                onChange={() =>
                                  toggleSubject(
                                    subject.id
                                  )
                                }
                              />

                              <span>
                                {
                                  subject.name
                                }
                              </span>
                            </label>
                          )
                        )}
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* ACTIONS */}

              <div className="modal-actions subject-modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    setShowSubjectModal(
                      false
                    )
                  }
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="primary-button"
                  onClick={
                    saveSubjectAssignments
                  }
                  disabled={
                    savingSubjects
                  }
                >
                  {savingSubjects
                    ? "Saving..."
                    : "Save Assignments"}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}