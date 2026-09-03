import { useCallback, useEffect, useMemo, useState } from "react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusLabel(status) {
  switch (status) {
    case "APPROVED":
      return "Approved";

    case "REJECTED":
      return "Rejected";

    default:
      return "Pending Review";
  }
}

export default function Applications() {
  const [applications, setApplications] =
    useState([]);

  const [grades, setGrades] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [filter, setFilter] =
    useState("PENDING");

  const [selectedGrades, setSelectedGrades] =
    useState({});

  const [adminNotes, setAdminNotes] =
    useState({});

  const [processingId, setProcessingId] =
    useState(null);

  /* ========================================
     LOAD ADMISSION APPLICATIONS
  ======================================== */

  const loadApplications =
    useCallback(async () => {
      try {
        setError("");

        const response = await fetch(
          `${API_URL}/admin/admissions`,
          {
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load admission applications."
          );
        }

        setApplications(
          Array.isArray(data) ? data : []
        );
      } catch (err) {
        console.error(
          "Load applications error:",
          err
        );

        setError(
          err.message ||
            "Unable to load admission applications."
        );
      }
    }, []);

  /* ========================================
     LOAD KTN GRADES
  ======================================== */

  const loadGrades =
    useCallback(async () => {
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
              "Unable to load KTN classes."
          );
        }

        /*
         * Supports:
         *
         * [
         *   { id, name, academicYear }
         * ]
         *
         * or:
         *
         * {
         *   grades: [...]
         * }
         */

        const gradeList = Array.isArray(data)
          ? data
          : Array.isArray(data.grades)
            ? data.grades
            : [];

        setGrades(gradeList);
      } catch (err) {
        console.error(
          "Load grades error:",
          err
        );

        setError(
          err.message ||
            "Unable to load KTN classes."
        );
      }
    }, []);

  /* ========================================
     INITIAL LOAD
  ======================================== */

  useEffect(() => {
    async function loadPage() {
      setLoading(true);

      await Promise.all([
        loadApplications(),
        loadGrades(),
      ]);

      setLoading(false);
    }

    loadPage();
  }, [
    loadApplications,
    loadGrades,
  ]);

  /* ========================================
     FILTER
  ======================================== */

  const filteredApplications =
    useMemo(() => {
      if (filter === "ALL") {
        return applications;
      }

      return applications.filter(
        (application) =>
          application.status === filter
      );
    }, [applications, filter]);

  const pendingCount =
    applications.filter(
      (item) =>
        item.status === "PENDING"
    ).length;

  const approvedCount =
    applications.filter(
      (item) =>
        item.status === "APPROVED"
    ).length;

  const rejectedCount =
    applications.filter(
      (item) =>
        item.status === "REJECTED"
    ).length;

  /* ========================================
     GRADE SELECT
  ======================================== */

  function handleGradeChange(
    applicationId,
    value
  ) {
    setSelectedGrades((current) => ({
      ...current,
      [applicationId]: value,
    }));
  }

  /* ========================================
     ADMIN NOTE
  ======================================== */

  function handleNoteChange(
    applicationId,
    value
  ) {
    setAdminNotes((current) => ({
      ...current,
      [applicationId]: value,
    }));
  }

  /* ========================================
     APPROVE
  ======================================== */

  async function handleApprove(application) {
    const gradeId = Number(
      selectedGrades[application.id]
    );

    if (!gradeId) {
      setSuccess("");
      setError(
        "Please select a KTN class before approving."
      );
      return;
    }

    const confirmed = window.confirm(
      `Approve ${application.student?.name || "this student"} and enroll them in the selected KTN class?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(application.id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/admin/admissions/${application.id}/approve`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            gradeId,

            adminNote:
              adminNotes[
                application.id
              ]?.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to approve admission."
        );
      }

      setSuccess(
        `${application.student?.name || "Student"} was approved and enrolled successfully.`
      );

      setSelectedGrades(
        (current) => {
          const next = {
            ...current,
          };

          delete next[
            application.id
          ];

          return next;
        }
      );

      setAdminNotes(
        (current) => {
          const next = {
            ...current,
          };

          delete next[
            application.id
          ];

          return next;
        }
      );

      await loadApplications();
    } catch (err) {
      console.error(
        "Approve application error:",
        err
      );

      setError(
        err.message ||
          "Unable to approve admission."
      );
    } finally {
      setProcessingId(null);
    }
  }

  /* ========================================
     REJECT
  ======================================== */

  async function handleReject(application) {
    const confirmed = window.confirm(
      `Reject the admission request for ${application.student?.name || "this student"}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessingId(application.id);
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/admin/admissions/${application.id}/reject`,
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            adminNote:
              adminNotes[
                application.id
              ]?.trim() || null,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to reject admission."
        );
      }

      setSuccess(
        `${application.student?.name || "Student"}'s admission request was rejected.`
      );

      setAdminNotes(
        (current) => {
          const next = {
            ...current,
          };

          delete next[
            application.id
          ];

          return next;
        }
      );

      await loadApplications();
    } catch (err) {
      console.error(
        "Reject application error:",
        err
      );

      setError(
        err.message ||
          "Unable to reject admission."
      );
    } finally {
      setProcessingId(null);
    }
  }

  /* ========================================
     LOADING
  ======================================== */

  if (loading) {
    return (
      <div className="admin-applications-page">
        <div className="applications-loading">
          Loading admission applications...
        </div>
      </div>
    );
  }

  return (
    <div className="admin-applications-page">
      {/* =================================
          PAGE HEADER
      ================================= */}

      <div className="applications-page-header">
        <div>
          <div className="page-eyebrow">
            ADMIN PORTAL
          </div>

          <h1>
            Admission Applications
          </h1>

          <p>
            Review parent-submitted
            admission requests and assign
            students to their KTN class.
          </p>
        </div>
      </div>

      {/* =================================
          SUMMARY
      ================================= */}

      <div className="applications-summary">
        <div className="application-summary-card">
          <span>Total</span>

          <strong>
            {applications.length}
          </strong>
        </div>

        <div className="application-summary-card pending">
          <span>Pending</span>

          <strong>
            {pendingCount}
          </strong>
        </div>

        <div className="application-summary-card approved">
          <span>Approved</span>

          <strong>
            {approvedCount}
          </strong>
        </div>

        <div className="application-summary-card rejected">
          <span>Rejected</span>

          <strong>
            {rejectedCount}
          </strong>
        </div>
      </div>

      {/* =================================
          MESSAGES
      ================================= */}

      {error && (
        <div className="applications-message error">
          {error}
        </div>
      )}

      {success && (
        <div className="applications-message success">
          {success}
        </div>
      )}

      {/* =================================
          FILTER
      ================================= */}

      <div className="applications-toolbar">
        <button
          type="button"
          className={
            filter === "PENDING"
              ? "application-filter active"
              : "application-filter"
          }
          onClick={() =>
            setFilter("PENDING")
          }
        >
          Pending
          <span>{pendingCount}</span>
        </button>

        <button
          type="button"
          className={
            filter === "APPROVED"
              ? "application-filter active"
              : "application-filter"
          }
          onClick={() =>
            setFilter("APPROVED")
          }
        >
          Approved
          <span>{approvedCount}</span>
        </button>

        <button
          type="button"
          className={
            filter === "REJECTED"
              ? "application-filter active"
              : "application-filter"
          }
          onClick={() =>
            setFilter("REJECTED")
          }
        >
          Rejected
          <span>{rejectedCount}</span>
        </button>

        <button
          type="button"
          className={
            filter === "ALL"
              ? "application-filter active"
              : "application-filter"
          }
          onClick={() =>
            setFilter("ALL")
          }
        >
          All
          <span>
            {applications.length}
          </span>
        </button>
      </div>

      {/* =================================
          APPLICATION LIST
      ================================= */}

      {filteredApplications.length ===
      0 ? (
        <div className="applications-empty">
          <div className="applications-empty-icon">
            ✓
          </div>

          <h3>
            No {filter.toLowerCase()} applications
          </h3>

          <p>
            Admission applications will
            appear here when parents submit
            them.
          </p>
        </div>
      ) : (
        <div className="applications-list">
          {filteredApplications.map(
            (application) => {
              const student =
                application.student || {};

              const parent =
                application.parent?.user ||
                {};

              const isPending =
                application.status ===
                "PENDING";

              const isProcessing =
                processingId ===
                application.id;

              const activeEnrollment =
                student.enrollments?.find(
                  (item) =>
                    item.isActive
                );

              return (
                <div
                  className="admission-application-card"
                  key={application.id}
                >
                  {/* HEADER */}

                  <div className="application-card-header">
                    <div className="application-student-heading">
                      <div className="application-avatar">
                        {student.name
                          ?.charAt(0)
                          ?.toUpperCase() ||
                          "S"}
                      </div>

                      <div>
                        <h2>
                          {student.name ||
                            "Unnamed Student"}
                        </h2>

                        <span>
                          Application #
                          {application.id}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`application-status ${application.status?.toLowerCase()}`}
                    >
                      {getStatusLabel(
                        application.status
                      )}
                    </span>
                  </div>

                  {/* INFORMATION */}

                  <div className="application-information-grid">
                    <div className="application-info-block">
                      <span>
                        Admission No.
                      </span>

                      <strong>
                        {student.admissionNumber ||
                          "Not provided"}
                      </strong>
                    </div>

                    <div className="application-info-block">
                      <span>
                        Date of Birth
                      </span>

                      <strong>
                        {formatDate(
                          student.dateOfBirth
                        )}
                      </strong>
                    </div>

                    <div className="application-info-block">
                      <span>
                        Gender
                      </span>

                      <strong>
                        {student.gender ||
                          "Not provided"}
                      </strong>
                    </div>

                    <div className="application-info-block">
                      <span>
                        Current School
                      </span>

                      <strong>
                        {student.schoolName ||
                          "Not provided"}
                      </strong>
                    </div>

                    <div className="application-info-block">
                      <span>
                        Current School Grade
                      </span>

                      <strong>
                        {student.schoolGrade ||
                          "Not provided"}
                      </strong>
                    </div>

                    <div className="application-info-block">
                      <span>
                        Submitted
                      </span>

                      <strong>
                        {formatDate(
                          application.submittedAt
                        )}
                      </strong>
                    </div>
                  </div>

                  {/* PARENT */}

                  <div className="application-parent-section">
                    <div>
                      <span>
                        Parent / Guardian
                      </span>

                      <strong>
                        {parent.name ||
                          "—"}
                      </strong>
                    </div>

                    <div>
                      <span>
                        Email
                      </span>

                      <strong>
                        {parent.email ||
                          "—"}
                      </strong>
                    </div>
                  </div>

                  {/* ALREADY REVIEWED */}

                  {!isPending && (
                    <div className="application-reviewed-section">
                      <div>
                        <span>
                          KTN Class
                        </span>

                        <strong>
                          {activeEnrollment
                            ?.grade?.name ||
                            (application.status ===
                            "REJECTED"
                              ? "Not assigned"
                              : "—")}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Reviewed By
                        </span>

                        <strong>
                          {application
                            .reviewedBy
                            ?.name || "—"}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Reviewed Date
                        </span>

                        <strong>
                          {formatDate(
                            application.reviewedAt
                          )}
                        </strong>
                      </div>

                      {application.adminNote && (
                        <div className="application-review-note">
                          <span>
                            Admin Note
                          </span>

                          <strong>
                            {
                              application.adminNote
                            }
                          </strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* PENDING REVIEW */}

                  {isPending && (
                    <div className="application-review-panel">
                      <h3>
                        Admission Review
                      </h3>

                      <div className="application-review-fields">
                        <div className="application-field">
                          <label
                            htmlFor={`grade-${application.id}`}
                          >
                            KTN Class
                            <span>
                              *
                            </span>
                          </label>

                          <select
                            id={`grade-${application.id}`}
                            value={
                              selectedGrades[
                                application
                                  .id
                              ] || ""
                            }
                            onChange={(
                              event
                            ) =>
                              handleGradeChange(
                                application.id,
                                event.target
                                  .value
                              )
                            }
                            disabled={
                              isProcessing
                            }
                          >
                            <option value="">
                              Select KTN
                              class
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
                        </div>

                        <div className="application-field">
                          <label
                            htmlFor={`note-${application.id}`}
                          >
                            Admin Note
                            <span className="optional-label">
                              Optional
                            </span>
                          </label>

                          <textarea
                            id={`note-${application.id}`}
                            rows="3"
                            placeholder="Add a note for this admission review..."
                            value={
                              adminNotes[
                                application
                                  .id
                              ] || ""
                            }
                            onChange={(
                              event
                            ) =>
                              handleNoteChange(
                                application.id,
                                event.target
                                  .value
                              )
                            }
                            disabled={
                              isProcessing
                            }
                          />
                        </div>
                      </div>

                      <div className="application-actions">
                        <button
                          type="button"
                          className="reject-application-button"
                          disabled={
                            isProcessing
                          }
                          onClick={() =>
                            handleReject(
                              application
                            )
                          }
                        >
                          {isProcessing
                            ? "Processing..."
                            : "Reject"}
                        </button>

                        <button
                          type="button"
                          className="approve-application-button"
                          disabled={
                            isProcessing
                          }
                          onClick={() =>
                            handleApprove(
                              application
                            )
                          }
                        >
                          {isProcessing
                            ? "Processing..."
                            : "Approve & Enroll"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            }
          )}
        </div>
      )}
    </div>
  );
}