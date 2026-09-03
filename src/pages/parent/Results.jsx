import {
  Award,
  BookOpen,
  GraduationCap,
  User,
} from "lucide-react";

import {
  useEffect,
  useState,
} from "react";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

function examLabel(examType) {
  if (examType === "SEMESTER_1") {
    return "Semester 1";
  }

  if (examType === "ANNUAL") {
    return "Annual Exam";
  }

  return examType || "Exam";
}

export default function ParentResults() {
  const [
    children,
    setChildren,
  ] = useState([]);

  const [
    selectedStudentId,
    setSelectedStudentId,
  ] = useState("");

  const [
    data,
    setData,
  ] = useState(null);

  const [
    loadingChildren,
    setLoadingChildren,
  ] = useState(true);

  const [
    loadingResults,
    setLoadingResults,
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
        setLoadingChildren(true);
        setError("");

        const response =
          await fetch(
            `${API_BASE}/results/parent/children`,
            {
              credentials: "include",
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to load children."
          );
        }

        const loadedChildren =
          Array.isArray(
            result.children
          )
            ? result.children
            : [];

        setChildren(
          loadedChildren
        );

        if (
          loadedChildren.length > 0
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

          setData(null);
        }
      } catch (err) {
        console.error(err);

        setChildren([]);
        setSelectedStudentId(
          ""
        );

        setData(null);

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
     LOAD SELECTED CHILD RESULTS
  ======================================== */

  useEffect(() => {
    if (!selectedStudentId) {
      setData(null);

      return;
    }

    async function loadResults() {
      try {
        setLoadingResults(
          true
        );

        setError("");

        /*
         * Clear the previous child's
         * result while loading.
         */

        setData(null);

        const response =
          await fetch(
            `${API_BASE}/results/parent/child/${selectedStudentId}`,
            {
              credentials:
                "include",
            }
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to load child results."
          );
        }

        setData(result);
      } catch (err) {
        console.error(err);

        setData(null);

        setError(
          err.message ||
            "Unable to load child results."
        );
      } finally {
        setLoadingResults(
          false
        );
      }
    }

    loadResults();
  }, [
    selectedStudentId,
  ]);

  /* ========================================
     LOADING CHILDREN
  ======================================== */

  if (loadingChildren) {
    return (
      <div className="parent-results-page">
        <div className="portal-page-header">
          <div>
            <h1>
              Results
            </h1>

            <p>
              Loading child
              information...
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ========================================
     UI
  ======================================== */

  return (
    <div className="parent-results-page">
      {/* PAGE HEADER */}

      <div className="portal-page-header">
        <div>
          <h1>
            Results
          </h1>

          <p>
            View your child&apos;s
            Semester 1 and Annual
            Exam results.
          </p>
        </div>

        {data?.academicYear && (
          <div className="results-year-badge">
            <Award size={18} />

            <span>
              Academic Year
            </span>

            <strong>
              {
                data
                  .academicYear
                  .name
              }
            </strong>
          </div>
        )}
      </div>

      {/* ERROR */}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* NO CHILDREN */}

      {children.length === 0 ? (
        <div className="portal-card">
          <div className="empty-state">
            <User size={30} />

            <p>
              No child is currently
              linked to your parent
              account.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* CHILD SELECTOR */}

          <section className="portal-card">
            <div className="card-heading-row">
              <div>
                <h2>
                  Select Child
                </h2>

                <p>
                  Choose the child
                  whose exam results
                  you want to view.
                </p>
              </div>

              <User size={22} />
            </div>

            <div className="form-group">
              <label htmlFor="result-child">
                Child
              </label>

              <select
                id="result-child"
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
          </section>

          {/* RESULTS */}

          {loadingResults ? (
            <div className="portal-card">
              <div className="empty-state">
                Loading results...
              </div>
            </div>
          ) : data ? (
            <>
              {/* CHILD SUMMARY */}

              <div className="student-results-summary">
                <div>
                  <User
                    size={22}
                  />

                  <span>
                    Student
                  </span>

                  <strong>
                    {data.student
                      ?.name ||
                      "Unnamed Student"}
                  </strong>
                </div>

                <div>
                  <GraduationCap
                    size={22}
                  />

                  <span>
                    Class
                  </span>

                  <strong>
                    {data.grade
                      ?.name ||
                      "Not assigned"}
                  </strong>
                </div>

                <div>
                  <BookOpen
                    size={22}
                  />

                  <span>
                    Admission No.
                  </span>

                  <strong>
                    {data.student
                      ?.admissionNumber ||
                      "—"}
                  </strong>
                </div>
              </div>

              {/* NOT YET ENROLLED */}

              {!data.grade ? (
                <div className="portal-card">
                  <div className="empty-state">
                    <GraduationCap
                      size={32}
                    />

                    <h3>
                      KTN Class Not
                      Assigned Yet
                    </h3>

                    <p>
                      This child has
                      not yet been
                      enrolled in an
                      active KTN
                      class. Exam
                      results will
                      become available
                      after admission
                      approval and
                      class assignment.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  {/* EXAMS */}

                  <div className="student-results-exams">
                    {!Array.isArray(
                      data.exams
                    ) ||
                    data.exams
                      .length ===
                      0 ? (
                      <div className="portal-card">
                        <div className="empty-state">
                          <Award
                            size={30}
                          />

                          <p>
                            No exams
                            are
                            currently
                            available.
                          </p>
                        </div>
                      </div>
                    ) : (
                      data.exams.map(
                        (
                          examGroup
                        ) => (
                          <section
                            className="portal-card student-result-exam-card"
                            key={
                              examGroup
                                .exam
                                .id
                            }
                          >
                            <div className="card-heading-row">
                              <div>
                                <h2>
                                  {examLabel(
                                    examGroup
                                      .exam
                                      .examType
                                  )}
                                </h2>

                                <p>
                                  {
                                    data
                                      .grade
                                      .name
                                  }{" "}
                                  exam
                                  results
                                </p>
                              </div>

                              <Award
                                size={
                                  22
                                }
                              />
                            </div>

                            {!Array.isArray(
                              examGroup.results
                            ) ||
                            examGroup
                              .results
                              .length ===
                              0 ? (
                              <div className="empty-state">
                                Results
                                have not
                                been
                                published
                                yet.
                              </div>
                            ) : (
                              <div className="results-table-wrap">
                                <table className="portal-table results-table">
                                  <thead>
                                    <tr>
                                      <th>
                                        Subject
                                      </th>

                                      <th>
                                        Marks
                                      </th>

                                      <th>
                                        Maximum
                                      </th>

                                      <th>
                                        Percentage
                                      </th>

                                      <th>
                                        Remarks
                                      </th>

                                      <th>
                                        Teacher
                                      </th>
                                    </tr>
                                  </thead>

                                  <tbody>
                                    {examGroup.results.map(
                                      (
                                        result
                                      ) => (
                                        <tr
                                          key={
                                            result.resultId
                                          }
                                        >
                                          <td>
                                            <strong>
                                              {result
                                                .subject
                                                ?.name ||
                                                "—"}
                                            </strong>
                                          </td>

                                          <td>
                                            {
                                              result.marksObtained
                                            }
                                          </td>

                                          <td>
                                            {
                                              result.maxMarks
                                            }
                                          </td>

                                          <td>
                                            <span className="result-percentage">
                                              {
                                                result.percentage
                                              }
                                              %
                                            </span>
                                          </td>

                                          <td>
                                            {result.remarks ||
                                              "—"}
                                          </td>

                                          <td>
                                            {result.teacher ||
                                              "—"}
                                          </td>
                                        </tr>
                                      )
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </section>
                        )
                      )
                    )}
                  </div>
                </>
              )}
            </>
          ) : null}
        </>
      )}
    </div>
  );
}