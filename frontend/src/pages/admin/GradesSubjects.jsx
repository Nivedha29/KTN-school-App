import { useEffect, useState } from "react";
import {
  BookOpen,
  GraduationCap,
  RefreshCw,
  Users,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

export default function GradesSubjects() {
  const [academicYear, setAcademicYear] = useState(null);
  const [grades, setGrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadGrades() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/academic/grades`,
        {
          method: "GET",
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

      setAcademicYear(data.academicYear);
      setGrades(data.grades || []);
    } catch (err) {
      console.error(err);

      setError(
        err.message ||
          "Unable to load grades."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadGrades();
  }, []);

  const totalSubjects = grades.reduce(
    (total, grade) =>
      total + grade.subjects.length,
    0
  );

  const totalStudents = grades.reduce(
    (total, grade) =>
      total + grade.studentCount,
    0
  );

  return (
    <div className="grades-subjects-page">
      <div className="page-header">
        <div>
          <h1>Grades & Subjects</h1>

          <p>
            Manage the academic structure
            and subjects for KTN Digital
            School.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={loadGrades}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {loading ? (
        <div className="admin-loading-card">
          Loading grades and subjects...
        </div>
      ) : (
        <>
          <div className="academic-summary-grid">
            <div className="academic-summary-card">
              <div className="summary-icon">
                <GraduationCap size={22} />
              </div>

              <div>
                <span>
                  Academic Year
                </span>

                <strong>
                  {academicYear?.name ||
                    "Not set"}
                </strong>
              </div>
            </div>

            <div className="academic-summary-card">
              <div className="summary-icon">
                <BookOpen size={22} />
              </div>

              <div>
                <span>Total Grades</span>

                <strong>
                  {grades.length}
                </strong>
              </div>
            </div>

            <div className="academic-summary-card">
              <div className="summary-icon">
                <BookOpen size={22} />
              </div>

              <div>
                <span>
                  Grade Subjects
                </span>

                <strong>
                  {totalSubjects}
                </strong>
              </div>
            </div>

            <div className="academic-summary-card">
              <div className="summary-icon">
                <Users size={22} />
              </div>

              <div>
                <span>
                  Enrolled Students
                </span>

                <strong>
                  {totalStudents}
                </strong>
              </div>
            </div>
          </div>

          <div className="grades-grid">
            {grades.map((grade) => (
              <div
                className="grade-card"
                key={grade.id}
              >
                <div className="grade-card-header">
                  <div>
                    <h2>{grade.name}</h2>

                    <p>
                      {
                        grade.studentCount
                      }{" "}
                      student
                      {grade.studentCount ===
                      1
                        ? ""
                        : "s"}
                    </p>
                  </div>

                  <div className="grade-number-badge">
                    {grade.name.replace(
                      "Grade ",
                      ""
                    )}
                  </div>
                </div>

                <div className="grade-subject-section">
                  <h3>Subjects</h3>

                  <div className="subject-list">
                    {grade.subjects.map(
                      (subject) => (
                        <div
                          className="subject-item"
                          key={subject.id}
                        >
                          <BookOpen
                            size={16}
                          />

                          <span>
                            {subject.name}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}