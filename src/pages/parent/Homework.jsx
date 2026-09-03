import {
  useEffect,
  useState,
} from "react";

import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  UserRound,
} from "lucide-react";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

function formatDate(dateString) {
  if (!dateString) {
    return "No due date";
  }

  return new Date(
    dateString
  ).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }
  );
}

export default function ParentHomework() {
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
    grade,
    setGrade,
  ] = useState(null);

  const [
    homework,
    setHomework,
  ] = useState([]);

  const [
    loadingChildren,
    setLoadingChildren,
  ] = useState(true);

  const [
    loadingHomework,
    setLoadingHomework,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* ========================================
     LOAD LINKED CHILDREN
  ======================================== */

  useEffect(() => {
    async function loadChildren() {
      try {
        setLoadingChildren(
          true
        );

        setError("");

        const response =
          await fetch(
            `${API_BASE}/homework/parent/children`,
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
              "Unable to load children."
          );
        }

        const loadedChildren =
          Array.isArray(
            data.children
          )
            ? data.children
            : [];

        setChildren(
          loadedChildren
        );

        if (
          loadedChildren.length >
          0
        ) {
          setSelectedStudentId(
            String(
              loadedChildren[0]
                .studentId
            )
          );
        } else {
          setSelectedStudentId(
            ""
          );

          setStudent(null);
          setGrade(null);
          setHomework([]);
        }
      } catch (err) {
        console.error(
          err
        );

        setChildren([]);
        setSelectedStudentId(
          ""
        );

        setStudent(null);
        setGrade(null);
        setHomework([]);

        setError(
          err.message ||
            "Unable to load children."
        );
      } finally {
        setLoadingChildren(
          false
        );
      }
    }

    loadChildren();
  }, []);

  /* ========================================
     LOAD CHILD HOMEWORK
  ======================================== */

  useEffect(() => {
    if (
      !selectedStudentId
    ) {
      setStudent(null);
      setGrade(null);
      setHomework([]);

      return;
    }

    async function loadHomework() {
      try {
        setLoadingHomework(
          true
        );

        setError("");

        /*
         * Clear previous child's
         * data during loading.
         */

        setStudent(null);
        setGrade(null);
        setHomework([]);

        const response =
          await fetch(
            `${API_BASE}/homework/parent/child/${selectedStudentId}`,
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
              "Unable to load homework."
          );
        }

        setStudent(
          data.student ||
            null
        );

        setGrade(
          data.grade ||
            null
        );

        setHomework(
          Array.isArray(
            data.homework
          )
            ? data.homework
            : []
        );
      } catch (err) {
        console.error(
          err
        );

        setStudent(null);
        setGrade(null);
        setHomework([]);

        setError(
          err.message ||
            "Unable to load homework."
        );
      } finally {
        setLoadingHomework(
          false
        );
      }
    }

    loadHomework();
  }, [
    selectedStudentId,
  ]);

  /* ========================================
     LOADING CHILDREN
  ======================================== */

  if (loadingChildren) {
    return (
      <div className="dashboard-card">
        <h2>
          Homework
        </h2>

        <p>
          Loading child
          information...
        </p>
      </div>
    );
  }

  /* ========================================
     UI
  ======================================== */

  return (
    <div className="student-homework-page">
      <div className="page-header">
        <div>
          <h1>
            Homework
          </h1>

          <p>
            View homework assigned
            to your child.
          </p>
        </div>
      </div>

      {error && (
        <div className="portal-alert error">
          {error}
        </div>
      )}

      {children.length ===
      0 ? (
        <div className="dashboard-card">
          <div className="empty-state">
            <BookOpen
              size={30}
            />

            <p>
              No child is currently
              linked to your parent
              account.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* =================================
              CHILD SELECTOR
          ================================= */}

          <div className="parent-child-card">
            <div className="parent-child-select">
              <div className="form-group">
                <label htmlFor="homework-child">
                  Select Child
                </label>

                <select
                  id="homework-child"
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
                >
                  {children.map(
                    (child) => (
                      <option
                        key={
                          child.studentId
                        }
                        value={
                          child.studentId
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

            {student && (
              <div className="parent-child-summary">
                <div className="parent-child-avatar">
                  {student.name
                    ?.charAt(
                      0
                    )
                    .toUpperCase() ||
                    "S"}
                </div>

                <div>
                  <h2>
                    {student.name ||
                      "Unnamed Student"}
                  </h2>

                  <p>
                    {student.admissionNumber ||
                      "No admission number"}

                    {grade
                      ? ` • ${grade.name}`
                      : " • KTN class not assigned"}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* =================================
              HOMEWORK
          ================================= */}

          {loadingHomework ? (
            <div className="dashboard-card">
              <p>
                Loading
                homework...
              </p>
            </div>
          ) : (
            <>
              {grade && (
                <div className="student-homework-grade-card">
                  <div className="student-homework-grade-icon">
                    <GraduationCap
                      size={22}
                    />
                  </div>

                  <div>
                    <span>
                      Current Class
                    </span>

                    <strong>
                      {grade.name}
                    </strong>
                  </div>
                </div>
              )}

              {!grade ? (
                <div className="dashboard-card">
                  <div className="empty-state">
                    <GraduationCap
                      size={30}
                    />

                    <p>
                      This child has
                      not yet been
                      assigned to an
                      active KTN
                      class.
                    </p>
                  </div>
                </div>
              ) : homework.length ===
                0 ? (
                <div className="dashboard-card">
                  <div className="empty-state">
                    <BookOpen
                      size={30}
                    />

                    <p>
                      No homework
                      has been
                      assigned yet.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="student-homework-grid">
                  {homework.map(
                    (item) => (
                      <article
                        key={
                          item.id
                        }
                        className="student-homework-card"
                      >
                        <div className="student-homework-card-top">
                          <div>
                            <span className="student-homework-subject">
                              {item
                                .subject
                                ?.name ||
                                "Subject"}
                            </span>

                            <h2>
                              {
                                item.title
                              }
                            </h2>
                          </div>

                          <BookOpen
                            size={22}
                          />
                        </div>

                        <p className="student-homework-description">
                          {item.description}
                        </p>

                        <div className="student-homework-meta">
                          <div>
                            <CalendarDays
                              size={16}
                            />

                            <span>
                              Due{" "}

                              <strong>
                                {formatDate(
                                  item.dueDate
                                )}
                              </strong>
                            </span>
                          </div>

                          <div>
                            <UserRound
                              size={16}
                            />

                            <span>
                              Teacher{" "}

                              <strong>
                                {item
                                  .teacher
                                  ?.user
                                  ?.name ||
                                  "—"}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </article>
                    )
                  )}
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}