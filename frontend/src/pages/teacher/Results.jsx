import {
  Award,
  BookOpen,
  CheckCircle2,
  Save,
} from "lucide-react";

import {
  useEffect,
  useMemo,
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

function normalizeStudents(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items.map((student) => ({
    ...student,

    name:
      student.name ||
      "Unnamed Student",

    admissionNumber:
      student.admissionNumber ||
      null,

    marksObtained:
      student.marksObtained ??
      "",

    maxMarks:
      student.maxMarks ??
      "",

    remarks:
      student.remarks ||
      "",
  }));
}

export default function TeacherResults() {
  const [
    subjects,
    setSubjects,
  ] = useState([]);

  const [
    exams,
    setExams,
  ] = useState([]);

  const [
    subjectId,
    setSubjectId,
  ] = useState("");

  const [
    examId,
    setExamId,
  ] = useState("");

  const [
    students,
    setStudents,
  ] = useState([]);

  const [
    subjectInfo,
    setSubjectInfo,
  ] = useState(null);

  const [
    academicYear,
    setAcademicYear,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    resultsLoading,
    setResultsLoading,
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
    success,
    setSuccess,
  ] = useState("");

  /* ========================================
     LOAD TEACHER SUBJECTS + EXAMS
  ======================================== */

  useEffect(() => {
    async function loadInitialData() {
      try {
        setLoading(true);
        setError("");
        setSuccess("");

        const [
          subjectsResponse,
          examsResponse,
        ] = await Promise.all([
          fetch(
            `${API_BASE}/results/teacher/subjects`,
            {
              credentials:
                "include",
            }
          ),

          fetch(
            `${API_BASE}/results/teacher/exams`,
            {
              credentials:
                "include",
            }
          ),
        ]);

        const subjectsData =
          await subjectsResponse.json();

        const examsData =
          await examsResponse.json();

        if (
          !subjectsResponse.ok
        ) {
          throw new Error(
            subjectsData.message ||
              "Unable to load subjects."
          );
        }

        if (!examsResponse.ok) {
          throw new Error(
            examsData.message ||
              "Unable to load exams."
          );
        }

        const loadedSubjects =
          Array.isArray(
            subjectsData.subjects
          )
            ? subjectsData.subjects
            : [];

        const loadedExams =
          Array.isArray(
            examsData.exams
          )
            ? examsData.exams
            : [];

        setSubjects(
          loadedSubjects
        );

        setExams(
          loadedExams
        );

        setAcademicYear(
          examsData.academicYear ||
            null
        );

        if (
          loadedSubjects.length >
          0
        ) {
          setSubjectId(
            String(
              loadedSubjects[0]
                .subjectId
            )
          );
        } else {
          setSubjectId("");
        }

        if (
          loadedExams.length >
          0
        ) {
          setExamId(
            String(
              loadedExams[0].id
            )
          );
        } else {
          setExamId("");
        }
      } catch (err) {
        console.error(err);

        setSubjects([]);
        setExams([]);

        setSubjectId("");
        setExamId("");

        setAcademicYear(null);

        setError(
          err.message ||
            "Unable to load results setup."
        );
      } finally {
        setLoading(false);
      }
    }

    loadInitialData();
  }, []);

  /* ========================================
     LOAD RESULT SHEET
  ======================================== */

  useEffect(() => {
    if (
      !subjectId ||
      !examId
    ) {
      setStudents([]);
      setSubjectInfo(null);

      return;
    }

    async function loadResults() {
      try {
        setResultsLoading(
          true
        );

        setError("");
        setSuccess("");

        /*
         * Clear previous result sheet
         * while another exam/subject
         * is loading.
         */

        setStudents([]);
        setSubjectInfo(null);

        const response =
          await fetch(
            `${API_BASE}/results/teacher/subject/${subjectId}/exam/${examId}`,
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
              "Unable to load results."
          );
        }

        setSubjectInfo(
          data.subject ||
            null
        );

        setStudents(
          normalizeStudents(
            data.students
          )
        );
      } catch (err) {
        console.error(err);

        setStudents([]);
        setSubjectInfo(null);

        setError(
          err.message ||
            "Unable to load results."
        );
      } finally {
        setResultsLoading(
          false
        );
      }
    }

    loadResults();
  }, [
    subjectId,
    examId,
  ]);

  /* ========================================
     SELECTED EXAM
  ======================================== */

  const selectedExam =
    useMemo(() => {
      return exams.find(
        (exam) =>
          String(exam.id) ===
          String(examId)
      );
    }, [
      exams,
      examId,
    ]);

  /* ========================================
     UPDATE STUDENT RESULT
  ======================================== */

  function updateStudent(
    studentId,
    field,
    value
  ) {
    setStudents(
      (current) =>
        current.map(
          (student) =>
            student.studentId ===
            studentId
              ? {
                  ...student,
                  [field]:
                    value,
                }
              : student
        )
    );

    setSuccess("");
  }

  /* ========================================
     SAVE RESULTS
  ======================================== */

  async function handleSave() {
    try {
      setError("");
      setSuccess("");

      if (
        !subjectId ||
        !examId
      ) {
        setError(
          "Please select an exam and subject."
        );

        return;
      }

      if (
        students.length === 0
      ) {
        setError(
          "No students are available for this class."
        );

        return;
      }

      /*
       * Validate all marks before
       * sending anything to backend.
       */

      for (
        const student of
        students
      ) {
        if (
          student.marksObtained ===
            "" ||
          student.maxMarks ===
            ""
        ) {
          setError(
            `Please enter marks for ${student.name}.`
          );

          return;
        }

        const marks =
          Number(
            student.marksObtained
          );

        const maximum =
          Number(
            student.maxMarks
          );

        if (
          Number.isNaN(marks) ||
          Number.isNaN(
            maximum
          ) ||
          maximum <= 0 ||
          marks < 0 ||
          marks > maximum
        ) {
          setError(
            `Please check the marks entered for ${student.name}.`
          );

          return;
        }
      }

      setSaving(true);

      const response =
        await fetch(
          `${API_BASE}/results/teacher`,
          {
            method: "POST",

            credentials:
              "include",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              examId:
                Number(examId),

              subjectId:
                Number(subjectId),

              results:
                students.map(
                  (student) => ({
                    studentId:
                      student.studentId,

                    marksObtained:
                      Number(
                        student.marksObtained
                      ),

                    maxMarks:
                      Number(
                        student.maxMarks
                      ),

                    remarks:
                      student.remarks
                        .trim(),
                  })
                ),
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to save results."
        );
      }

      setSuccess(
        data.message ||
          "Exam results saved successfully."
      );

      /* ==================================
         RELOAD SAVED RESULT SHEET
      ================================== */

      const refreshedResponse =
        await fetch(
          `${API_BASE}/results/teacher/subject/${subjectId}/exam/${examId}`,
          {
            credentials:
              "include",
          }
        );

      const refreshedData =
        await refreshedResponse.json();

      if (
        refreshedResponse.ok
      ) {
        setSubjectInfo(
          refreshedData.subject ||
            null
        );

        setStudents(
          normalizeStudents(
            refreshedData.students
          )
        );
      }
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to save results."
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
      <div className="results-page">
        <div className="portal-page-header">
          <div>
            <h1>
              Exam Results
            </h1>

            <p>
              Loading exam
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
    <div className="results-page">
      {/* PAGE HEADER */}

      <div className="portal-page-header">
        <div>
          <h1>
            Exam Results
          </h1>

          <p>
            Enter and manage
            student exam marks for
            your assigned subjects.
          </p>
        </div>

        {academicYear && (
          <div className="results-year-badge">
            <Award size={18} />

            <span>
              Academic Year
            </span>

            <strong>
              {
                academicYear.name
              }
            </strong>
          </div>
        )}
      </div>

      {/* ALERTS */}

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <CheckCircle2
            size={18}
          />

          {success}
        </div>
      )}

      {/* ==================================
          EXAM / SUBJECT SELECTION
      ================================== */}

      <section className="portal-card results-selection-card">
        <div className="card-heading-row">
          <div>
            <h2>
              Select Exam & Subject
            </h2>

            <p>
              Choose the examination
              and class subject
              before entering marks.
            </p>
          </div>

          <BookOpen
            size={22}
          />
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="result-exam">
              Exam
            </label>

            <select
              id="result-exam"
              value={examId}
              onChange={(
                event
              ) =>
                setExamId(
                  event.target
                    .value
                )
              }
              disabled={
                exams.length ===
                0
              }
            >
              {exams.length ===
                0 && (
                <option value="">
                  No exams
                  available
                </option>
              )}

              {exams.map(
                (exam) => (
                  <option
                    key={
                      exam.id
                    }
                    value={
                      exam.id
                    }
                  >
                    {examLabel(
                      exam.examType
                    )}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="result-subject">
              Class / Subject
            </label>

            <select
              id="result-subject"
              value={
                subjectId
              }
              onChange={(
                event
              ) =>
                setSubjectId(
                  event.target
                    .value
                )
              }
              disabled={
                subjects.length ===
                0
              }
            >
              {subjects.length ===
                0 && (
                <option value="">
                  No assigned
                  subjects
                </option>
              )}

              {subjects.map(
                (subject) => (
                  <option
                    key={
                      subject.subjectId
                    }
                    value={
                      subject.subjectId
                    }
                  >
                    {
                      subject.gradeName
                    }{" "}
                    -{" "}
                    {
                      subject.subjectName
                    }
                  </option>
                )
              )}
            </select>
          </div>
        </div>
      </section>

      {/* ==================================
          RESULT SHEET
      ================================== */}

      <section className="portal-card results-sheet-card">
        <div className="card-heading-row">
          <div>
            <h2>
              {selectedExam
                ? examLabel(
                    selectedExam.examType
                  )
                : "Result Sheet"}
            </h2>

            <p>
              {subjectInfo
                ? `${subjectInfo.gradeName} • ${subjectInfo.name}`
                : "Select an exam and subject."}
            </p>
          </div>

          {students.length >
            0 && (
            <div className="results-student-count">
              {students.length}{" "}

              {students.length ===
              1
                ? "Student"
                : "Students"}
            </div>
          )}
        </div>

        {resultsLoading ? (
          <div className="empty-state">
            Loading students and
            results...
          </div>
        ) : !subjectId ||
          !examId ? (
          <div className="empty-state">
            Select an exam and
            subject to enter
            results.
          </div>
        ) : students.length ===
          0 ? (
          <div className="empty-state">
            No active students
            found for this class.
          </div>
        ) : (
          <>
            <div className="results-table-wrap">
              <table className="portal-table results-table">
                <thead>
                  <tr>
                    <th>
                      Admission No.
                    </th>

                    <th>
                      Student
                    </th>

                    <th>
                      Marks
                    </th>

                    <th>
                      Maximum Marks
                    </th>

                    <th>
                      Remarks
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {students.map(
                    (student) => (
                      <tr
                        key={
                          student.studentId
                        }
                      >
                        <td>
                          <span className="results-admission">
                            {student.admissionNumber ||
                              "—"}
                          </span>
                        </td>

                        <td>
                          <strong>
                            {
                              student.name
                            }
                          </strong>
                        </td>

                        <td>
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            value={
                              student.marksObtained
                            }
                            onChange={(
                              event
                            ) =>
                              updateStudent(
                                student.studentId,
                                "marksObtained",
                                event
                                  .target
                                  .value
                              )
                            }
                            placeholder="0"
                            aria-label={`Marks for ${student.name}`}
                          />
                        </td>

                        <td>
                          <input
                            type="number"
                            min="1"
                            step="0.5"
                            value={
                              student.maxMarks
                            }
                            onChange={(
                              event
                            ) =>
                              updateStudent(
                                student.studentId,
                                "maxMarks",
                                event
                                  .target
                                  .value
                              )
                            }
                            placeholder="100"
                            aria-label={`Maximum marks for ${student.name}`}
                          />
                        </td>

                        <td>
                          <input
                            type="text"
                            value={
                              student.remarks
                            }
                            onChange={(
                              event
                            ) =>
                              updateStudent(
                                student.studentId,
                                "remarks",
                                event
                                  .target
                                  .value
                              )
                            }
                            placeholder="Optional remark"
                            aria-label={`Remarks for ${student.name}`}
                          />
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            <div className="results-actions">
              <p>
                Review the marks
                carefully before
                saving.
              </p>

              <button
                type="button"
                className="primary-button"
                onClick={
                  handleSave
                }
                disabled={
                  saving ||
                  resultsLoading
                }
              >
                <Save
                  size={18}
                />

                {saving
                  ? "Saving..."
                  : "Save Results"}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}