import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Plus,
  Search,
  UserPlus,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const emptyForm = {
  name: "",
  admissionNumber: "",
  dateOfBirth: "",
  gender: "",
  schoolName: "",
  schoolGrade: "",
};

export default function Students() {
  const [students, setStudents] =
    useState([]);

  const [grades, setGrades] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  const [showModal, setShowModal] =
    useState(false);

  const [form, setForm] =
    useState(emptyForm);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [gradeMessage, setGradeMessage] =
    useState("");

  const [updatingGrade, setUpdatingGrade] =
    useState(null);

  /* ========================================
     LOAD STUDENTS
  ======================================== */

  async function loadStudents() {
    const response = await fetch(
      `${API_URL}/students`,
      {
        credentials: "include",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Unable to load students."
      );
    }

    setStudents(data.students || []);
  }

  /* ========================================
     LOAD GRADES
  ======================================== */

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

    const gradeList = Array.isArray(data)
      ? data
      : data.grades || [];

    setGrades(gradeList);
  }

  /* ========================================
     LOAD PAGE
  ======================================== */

  async function loadPage() {
    try {
      setLoading(true);
      setError("");

      await Promise.all([
        loadStudents(),
        loadGrades(),
      ]);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to load page."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPage();
  }, []);

  /* ========================================
     SEARCH
  ======================================== */

  const filteredStudents =
    useMemo(() => {
      const query = search
        .trim()
        .toLowerCase();

      if (!query) {
        return students;
      }

      return students.filter(
        (student) => {
          const name =
            student.name || "";

          const admissionNumber =
            student.admissionNumber ||
            "";

          const schoolName =
            student.schoolName || "";

          const schoolGrade =
            student.schoolGrade || "";

          const parentNames =
            student.parents
              ?.map(
                (parent) =>
                  parent.user?.name || ""
              )
              .join(" ") || "";

          return (
            name
              .toLowerCase()
              .includes(query) ||
            admissionNumber
              .toLowerCase()
              .includes(query) ||
            schoolName
              .toLowerCase()
              .includes(query) ||
            schoolGrade
              .toLowerCase()
              .includes(query) ||
            parentNames
              .toLowerCase()
              .includes(query)
          );
        }
      );
    }, [students, search]);

  /* ========================================
     FORM
  ======================================== */

  function handleChange(event) {
    const { name, value } =
      event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  /* ========================================
     CREATE STUDENT
  ======================================== */

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setGradeMessage("");

      const response = await fetch(
        `${API_URL}/students`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            name: form.name.trim(),

            admissionNumber:
              form.admissionNumber.trim(),

            dateOfBirth:
              form.dateOfBirth ||
              undefined,

            gender:
              form.gender ||
              undefined,

            schoolName:
              form.schoolName.trim() ||
              undefined,

            schoolGrade:
              form.schoolGrade.trim() ||
              undefined,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to create student."
        );
      }

      setForm(emptyForm);
      setShowModal(false);

      setGradeMessage(
        `${data.student?.name || "Student"} created successfully.`
      );

      await loadStudents();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to create student."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ========================================
     ASSIGN / CHANGE KTN CLASS
  ======================================== */

  async function handleGradeChange(
    studentId,
    gradeId
  ) {
    if (!gradeId) {
      return;
    }

    try {
      setUpdatingGrade(studentId);
      setError("");
      setGradeMessage("");

      const response = await fetch(
        `${API_URL}/students/${studentId}/grade`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            gradeId: Number(gradeId),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to assign KTN class."
        );
      }

      setGradeMessage(
        data.message ||
          "KTN class updated successfully."
      );

      await loadStudents();
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to assign KTN class."
      );
    } finally {
      setUpdatingGrade(null);
    }
  }

  /* ========================================
     HELPERS
  ======================================== */

  function getCurrentGrade(student) {
    if (!student.enrollment?.grade?.id) {
      return "";
    }

    return String(
      student.enrollment.grade.id
    );
  }

  function formatDate(value) {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (
      Number.isNaN(date.getTime())
    ) {
      return "—";
    }

    return date.toLocaleDateString();
  }

  function getParentName(student) {
    if (
      !student.parents ||
      student.parents.length === 0
    ) {
      return "—";
    }

    return student.parents
      .map((parent) => {
        const name =
          parent.user?.name ||
          "Parent";

        if (parent.relationship) {
          return `${name} (${parent.relationship})`;
        }

        return name;
      })
      .join(", ");
  }

  function getAdmissionLabel(status) {
    switch (status) {
      case "APPROVED":
        return "Approved";

      case "REJECTED":
        return "Rejected";

      case "PENDING":
        return "Pending";

      default:
        return "Direct Entry";
    }
  }

  /* ========================================
     LOADING
  ======================================== */

  if (loading) {
    return (
      <div className="admin-students-page">
        <div className="students-card">
          Loading students...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-students-page">
      {/* =================================
          HEADER
      ================================= */}

      <div className="page-header">
        <div>
          <h1>Students</h1>

          <p>
            Manage student records and
            their KTN class enrollment.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() => {
            setError("");
            setGradeMessage("");
            setForm(emptyForm);
            setShowModal(true);
          }}
        >
          <Plus size={18} />
          Add Student
        </button>
      </div>

      {/* =================================
          MESSAGES
      ================================= */}

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {gradeMessage && (
        <div className="success-message">
          {gradeMessage}
        </div>
      )}

      {/* =================================
          STATISTICS
      ================================= */}

      <div className="stats-card">
        <div>
          <span>Total Students</span>

          <strong>
            {students.length}
          </strong>
        </div>

        <UserPlus size={24} />
      </div>

      {/* =================================
          STUDENT TABLE
      ================================= */}

      <div className="students-card">
        <div className="students-toolbar">
          <div className="student-search">
            <Search size={18} />

            <input
              type="text"
              placeholder="Search by name, admission number, school or parent..."
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
                <th>Student</th>
                <th>Admission No.</th>
                <th>KTN Class</th>
                <th>Current School</th>
                <th>School Grade</th>
                <th>Parent / Guardian</th>
                <th>Date of Birth</th>
                <th>Gender</th>
                <th>Admission</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredStudents.length ===
              0 ? (
                <tr>
                  <td
                    colSpan="10"
                    className="empty-table"
                  >
                    No students found.
                  </td>
                </tr>
              ) : (
                filteredStudents.map(
                  (student) => {
                    const currentGrade =
                      getCurrentGrade(
                        student
                      );

                    return (
                      <tr
                        key={student.id}
                      >
                        {/* STUDENT */}

                        <td>
                          <div className="student-name-cell">
                            <div className="student-avatar">
                              {student.name
                                ?.charAt(0)
                                ?.toUpperCase() ||
                                "S"}
                            </div>

                            <strong>
                              {student.name ||
                                "Unnamed Student"}
                            </strong>
                          </div>
                        </td>

                        {/* ADMISSION NUMBER */}

                        <td>
                          {student.admissionNumber ||
                            "—"}
                        </td>

                        {/* KTN CLASS */}

                        <td>
                          <select
                            className="grade-select"
                            value={
                              currentGrade
                            }
                            disabled={
                              updatingGrade ===
                              student.id
                            }
                            onChange={(
                              event
                            ) =>
                              handleGradeChange(
                                student.id,
                                event
                                  .target
                                  .value
                              )
                            }
                          >
                            <option value="">
                              Not assigned
                            </option>

                            {grades.map(
                              (grade) => (
                                <option
                                  key={
                                    grade.id
                                  }
                                  value={
                                    grade.id
                                  }
                                >
                                  {
                                    grade.name
                                  }
                                  {grade
                                    .academicYear
                                    ?.name
                                    ? ` — ${grade.academicYear.name}`
                                    : ""}
                                </option>
                              )
                            )}
                          </select>
                        </td>

                        {/* CURRENT SCHOOL */}

                        <td>
                          {student.schoolName ||
                            "—"}
                        </td>

                        {/* SCHOOL GRADE */}

                        <td>
                          {student.schoolGrade ||
                            "—"}
                        </td>

                        {/* PARENT */}

                        <td>
                          {getParentName(
                            student
                          )}
                        </td>

                        {/* DOB */}

                        <td>
                          {formatDate(
                            student.dateOfBirth
                          )}
                        </td>

                        {/* GENDER */}

                        <td>
                          {student.gender ||
                            "—"}
                        </td>

                        {/* ADMISSION STATUS */}

                        <td>
                          <span
                            className={`admission-table-badge ${
                              student.admissionStatus
                                ?.toLowerCase() ||
                              "direct"
                            }`}
                          >
                            {getAdmissionLabel(
                              student.admissionStatus
                            )}
                          </span>
                        </td>

                        {/* ACTIVE STATUS */}

                        <td>
                          <span
                            className={`status-badge ${
                              student.isActive
                                ? "active"
                                : "inactive"
                            }`}
                          >
                            {student.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
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

      {/* =================================
          ADD STUDENT MODAL
      ================================= */}

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
                <h2>Add Student</h2>

                <p>
                  Create a student record.
                  Students do not require
                  login accounts.
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
              {/* NAME */}

              <div className="form-group">
                <label>
                  Student Name
                </label>

                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Student full name"
                  required
                />
              </div>

              {/* ADMISSION NUMBER */}

              <div className="form-group">
                <label>
                  Admission Number
                </label>

                <input
                  name="admissionNumber"
                  value={
                    form.admissionNumber
                  }
                  onChange={handleChange}
                  placeholder="Admission number"
                  required
                />
              </div>

              {/* DOB + GENDER */}

              <div className="form-row">
                <div className="form-group">
                  <label>
                    Date of Birth
                  </label>

                  <input
                    type="date"
                    name="dateOfBirth"
                    value={
                      form.dateOfBirth
                    }
                    onChange={
                      handleChange
                    }
                  />
                </div>

                <div className="form-group">
                  <label>
                    Gender
                  </label>

                  <select
                    name="gender"
                    value={form.gender}
                    onChange={
                      handleChange
                    }
                  >
                    <option value="">
                      Select
                    </option>

                    <option value="Male">
                      Male
                    </option>

                    <option value="Female">
                      Female
                    </option>

                    <option value="Other">
                      Other
                    </option>
                  </select>
                </div>
              </div>

              {/* CURRENT SCHOOL */}

              <div className="form-group">
                <label>
                  Current School
                </label>

                <input
                  name="schoolName"
                  value={
                    form.schoolName
                  }
                  onChange={handleChange}
                  placeholder="Current school name"
                />
              </div>

              {/* CURRENT SCHOOL GRADE */}

              <div className="form-group">
                <label>
                  Current School Grade
                </label>

                <input
                  name="schoolGrade"
                  value={
                    form.schoolGrade
                  }
                  onChange={handleChange}
                  placeholder="Example: Grade 3"
                />
              </div>

              {/* INFORMATION */}

              <div className="student-account-info">
                This creates only a student
                profile. No email, password,
                or student login account will
                be created.
              </div>

              {/* ACTIONS */}

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
                    : "Create Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}