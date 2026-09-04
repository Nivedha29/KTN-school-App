import { useEffect, useState } from "react";
import {
  Baby,
  CalendarDays,
  GraduationCap,
  Plus,
  School,
  UserRound,
  X,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const EMPTY_FORM = {
  name: "",
  admissionNumber: "",
  dateOfBirth: "",
  gender: "",
  schoolName: "",
  schoolGrade: "",
  relationship: "Parent",
};

export default function MyChildren() {
  const [children, setChildren] =
    useState([]);

  const [form, setForm] =
    useState(EMPTY_FORM);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [showModal, setShowModal] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [
    admissionOpen,
    setAdmissionOpen,
  ] = useState(true);

  const [
    admissionStatusLoading,
    setAdmissionStatusLoading,
  ] = useState(true);

  useEffect(() => {
    loadChildren();
    loadAdmissionStatus();
  }, []);

  /* ========================================
     LOAD CHILDREN
  ======================================== */

  async function loadChildren() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/parents/me/children`,
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

      setChildren(
        Array.isArray(data)
          ? data
          : data.children || []
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to load children."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ========================================
     LOAD ADMISSION STATUS
  ======================================== */

  async function loadAdmissionStatus() {
    try {
      setAdmissionStatusLoading(
        true
      );

      const response = await fetch(
        `${API_URL}/settings/admission-status`,
        {
          credentials: "include",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to check admission status."
        );
      }

      setAdmissionOpen(
        data.admissionOpen !== false
      );
    } catch (err) {
      console.error(
        "Admission status error:",
        err
      );

      /*
       * Do not incorrectly block
       * admissions when the status
       * endpoint temporarily fails.
       *
       * The backend POST route still
       * performs the final admission
       * availability check.
       */

      setAdmissionOpen(true);
    } finally {
      setAdmissionStatusLoading(
        false
      );
    }
  }

  /* ========================================
     FORM HANDLERS
  ======================================== */

  function handleChange(event) {
    const {
      name,
      value,
    } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function openAddChild() {
    setError("");
    setSuccess("");

    if (
      admissionStatusLoading
    ) {
      setError(
        "Please wait while the admission status is being checked."
      );

      return;
    }

    if (!admissionOpen) {
      setError(
        "Admissions are currently closed. Please contact KTN Digital School for further information."
      );

      return;
    }

    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function closeModal() {
    if (saving) {
      return;
    }

    setShowModal(false);
    setForm(EMPTY_FORM);
    setError("");
  }

  /* ========================================
     SUBMIT ADMISSION
  ======================================== */

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    /*
     * Frontend protection.
     *
     * Backend also checks this,
     * so the admission rule cannot
     * be bypassed through the API.
     */

    if (!admissionOpen) {
      setError(
        "Admissions are currently closed. Please contact KTN Digital School for further information."
      );

      return;
    }

    if (!form.name.trim()) {
      setError(
        "Please enter the child's name."
      );

      return;
    }

    try {
      setSaving(true);

      const response = await fetch(
        `${API_URL}/parents/me/children`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            name:
              form.name.trim(),

            admissionNumber:
              form.admissionNumber.trim() ||
              null,

            dateOfBirth:
              form.dateOfBirth ||
              null,

            gender:
              form.gender ||
              null,

            schoolName:
              form.schoolName.trim() ||
              null,

            schoolGrade:
              form.schoolGrade.trim() ||
              null,

            relationship:
              form.relationship.trim() ||
              "Parent",
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        /*
         * Admin may close admissions
         * while the modal is already open.
         */

        if (
          response.status === 403
        ) {
          setAdmissionOpen(false);
          setShowModal(false);
        }

        throw new Error(
          data.message ||
            "Unable to submit admission request."
        );
      }

      setSuccess(
        `${form.name.trim()}'s admission request was submitted successfully.`
      );

      setShowModal(false);
      setForm(EMPTY_FORM);

      await loadChildren();
    } catch (err) {
      setError(
        err.message ||
          "Unable to submit admission request."
      );
    } finally {
      setSaving(false);
    }
  }

  /* ========================================
     LOADING
  ======================================== */

  if (loading) {
    return (
      <div className="page-loading">
        Loading children...
      </div>
    );
  }

  return (
    <div className="parent-children-page">
      {/* =====================================
          PAGE HEADER
      ===================================== */}

      <div className="page-header">
        <div>
          <span className="eyebrow">
            PARENT PORTAL
          </span>

          <h1>My Children</h1>

          <p>
            Register your child and submit
            an admission request for KTN
            review.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={openAddChild}
          disabled={
            admissionStatusLoading ||
            !admissionOpen
          }
          title={
            !admissionOpen
              ? "Admissions are currently closed"
              : ""
          }
        >
          <Plus size={18} />

          {admissionStatusLoading
            ? "Checking..."
            : admissionOpen
              ? "Add Child"
              : "Admissions Closed"}
        </button>
      </div>

      {/* =====================================
          ADMISSIONS CLOSED NOTICE
      ===================================== */}

      {!admissionStatusLoading &&
        !admissionOpen && (
          <div className="form-error">
            <strong>
              Admissions are currently
              closed.
            </strong>{" "}
            New admission applications
            are not being accepted at
            this time. Please contact KTN
            Digital School for further
            information.
          </div>
        )}

      {/* =====================================
          GENERAL ERROR
      ===================================== */}

      {error &&
        !showModal && (
          <div className="form-error">
            {error}
          </div>
        )}

      {/* =====================================
          SUCCESS MESSAGE
      ===================================== */}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      {/* =====================================
          EMPTY STATE
      ===================================== */}

      {children.length === 0 ? (
        <div className="empty-children-card">
          <div className="empty-children-icon">
            <Baby size={34} />
          </div>

          <h2>
            No children registered yet
          </h2>

          <p>
            {admissionOpen
              ? "Add your child and submit an admission request. The KTN admin team will review the request and assign the appropriate KTN class after approval."
              : "New admission applications are currently closed. You can add your child when KTN Digital School reopens admissions."}
          </p>

          <button
            type="button"
            className="primary-button"
            onClick={openAddChild}
            disabled={
              admissionStatusLoading ||
              !admissionOpen
            }
          >
            <Plus size={18} />

            {admissionStatusLoading
              ? "Checking..."
              : admissionOpen
                ? "Add Your First Child"
                : "Admissions Closed"}
          </button>
        </div>
      ) : (
        /* =====================================
           CHILD CARDS
        ===================================== */

        <div className="children-grid">
          {children.map(
            (item) => {
              const child =
                item.student ||
                item;

              const enrollment =
                child.enrollments?.find(
                  (entry) =>
                    entry.isActive !==
                    false
                ) ||
                item.enrollment ||
                null;

              const grade =
                enrollment?.grade ||
                null;

              const admissionStatus =
                item.admissionStatus ||
                child.admissionStatus ||
                "PENDING";

              return (
                <article
                  className="child-card"
                  key={child.id}
                >
                  {/* CHILD HEADER */}

                  <div className="child-card-header">
                    <div className="child-avatar">
                      {child.name
                        ?.charAt(0)
                        ?.toUpperCase() ||
                        "C"}
                    </div>

                    <div>
                      <h2>
                        {child.name}
                      </h2>

                      <span className="child-relationship">
                        {item.relationship ||
                          "Parent"}
                      </span>
                    </div>
                  </div>

                  {/* CHILD DETAILS */}

                  <div className="child-details">
                    <div>
                      <UserRound
                        size={17}
                      />

                      <span>
                        <small>
                          Admission No.
                        </small>

                        <strong>
                          {child.admissionNumber ||
                            "Pending"}
                        </strong>
                      </span>
                    </div>

                    <div>
                      <CalendarDays
                        size={17}
                      />

                      <span>
                        <small>
                          Date of birth
                        </small>

                        <strong>
                          {child.dateOfBirth
                            ? formatDate(
                                child.dateOfBirth
                              )
                            : "Not provided"}
                        </strong>
                      </span>
                    </div>

                    <div>
                      <School
                        size={17}
                      />

                      <span>
                        <small>
                          Current School
                        </small>

                        <strong>
                          {child.schoolName ||
                            "Not provided"}
                        </strong>
                      </span>
                    </div>

                    <div>
                      <GraduationCap
                        size={17}
                      />

                      <span>
                        <small>
                          Current School
                          Grade
                        </small>

                        <strong>
                          {child.schoolGrade ||
                            "Not provided"}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* ADMISSION STATUS */}

                  <div className="child-admission-row">
                    <span>
                      Admission Status
                    </span>

                    <AdmissionStatus
                      status={
                        admissionStatus
                      }
                    />
                  </div>

                  {/* KTN CLASS */}

                  <div className="child-enrollment">
                    <span>
                      KTN Class
                    </span>

                    {grade ? (
                      <strong>
                        {grade.name}
                      </strong>
                    ) : (
                      <strong className="not-enrolled">
                        Not assigned yet
                      </strong>
                    )}
                  </div>
                </article>
              );
            }
          )}
        </div>
      )}

      {/* =====================================
          ADD CHILD MODAL
      ===================================== */}

      {showModal &&
        admissionOpen && (
          <div className="modal-backdrop">
            <div className="child-modal">
              <div className="modal-header">
                <div>
                  <h2>
                    Add Child
                  </h2>

                  <p>
                    Register your child
                    and submit an
                    admission request
                    to KTN.
                  </p>
                </div>

                <button
                  type="button"
                  className="modal-close"
                  onClick={
                    closeModal
                  }
                  disabled={
                    saving
                  }
                  aria-label="Close"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                className="child-form"
                onSubmit={
                  handleSubmit
                }
              >
                {error && (
                  <div className="form-error">
                    {error}
                  </div>
                )}

                <div className="form-grid">
                  {/* CHILD NAME */}

                  <label>
                    Child Name *

                    <input
                      type="text"
                      name="name"
                      value={
                        form.name
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Full name"
                      required
                    />
                  </label>

                  {/* ADMISSION NUMBER */}

                  <label>
                    Admission Number

                    <input
                      type="text"
                      name="admissionNumber"
                      value={
                        form.admissionNumber
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Optional"
                    />
                  </label>

                  {/* DATE OF BIRTH */}

                  <label>
                    Date of Birth

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
                  </label>

                  {/* GENDER */}

                  <label>
                    Gender

                    <select
                      name="gender"
                      value={
                        form.gender
                      }
                      onChange={
                        handleChange
                      }
                    >
                      <option value="">
                        Select gender
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

                      <option value="Prefer not to say">
                        Prefer not to
                        say
                      </option>
                    </select>
                  </label>

                  {/* CURRENT SCHOOL */}

                  <label>
                    Current School

                    <input
                      type="text"
                      name="schoolName"
                      value={
                        form.schoolName
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="School name"
                    />
                  </label>

                  {/* CURRENT SCHOOL GRADE */}

                  <label>
                    Current School Grade

                    <input
                      type="text"
                      name="schoolGrade"
                      value={
                        form.schoolGrade
                      }
                      onChange={
                        handleChange
                      }
                      placeholder="Example: Grade 3"
                    />
                  </label>

                  {/* RELATIONSHIP */}

                  <label className="full-width">
                    Relationship

                    <select
                      name="relationship"
                      value={
                        form.relationship
                      }
                      onChange={
                        handleChange
                      }
                    >
                      <option value="Parent">
                        Parent
                      </option>

                      <option value="Mother">
                        Mother
                      </option>

                      <option value="Father">
                        Father
                      </option>

                      <option value="Guardian">
                        Guardian
                      </option>
                    </select>
                  </label>
                </div>

                {/* ADMISSION PROCESS INFO */}

                <div className="admission-info-box">
                  <strong>
                    What happens next?
                  </strong>

                  <p>
                    After you submit
                    this request, the
                    KTN admin team will
                    review the child's
                    details. Once
                    approved, the admin
                    will assign the
                    appropriate KTN
                    class.
                  </p>
                </div>

                {/* MODAL ACTIONS */}

                <div className="modal-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={
                      closeModal
                    }
                    disabled={
                      saving
                    }
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="primary-button"
                    disabled={
                      saving ||
                      !admissionOpen
                    }
                  >
                    {saving
                      ? "Submitting..."
                      : "Submit Admission Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
}

/* ========================================
   ADMISSION STATUS COMPONENT
======================================== */

function AdmissionStatus({
  status,
}) {
  const normalized =
    String(status || "")
      .toUpperCase();

  if (
    normalized === "APPROVED"
  ) {
    return (
      <span className="admission-status approved">
        Approved
      </span>
    );
  }

  if (
    normalized === "REJECTED"
  ) {
    return (
      <span className="admission-status rejected">
        Rejected
      </span>
    );
  }

  return (
    <span className="admission-status pending">
      Pending Review
    </span>
  );
}

/* ========================================
   DATE FORMATTER
======================================== */

function formatDate(value) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return value;
  }

  return new Intl.DateTimeFormat(
    "en",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  ).format(date);
}