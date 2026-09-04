import {
  Award,
  BookOpen,
  GraduationCap,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

const examLabel = (examType) => {
  if (examType === "SEMESTER_1") {
    return "Semester 1";
  }

  if (examType === "ANNUAL") {
    return "Annual Exam";
  }

  return examType;
};

export default function StudentResults() {
  const [data, setData] = useState(null);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");

  useEffect(() => {
    const loadResults = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE}/results/student`,
          {
            credentials: "include",
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              "Unable to load results."
          );
        }

        setData(result);
      } catch (err) {
        setError(
          err.message ||
            "Unable to load results."
        );
      } finally {
        setLoading(false);
      }
    };

    loadResults();
  }, []);

  if (loading) {
    return (
      <div className="student-results-page">
        <div className="portal-page-header">
          <div>
            <h1>My Results</h1>
            <p>
              Loading your exam results...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-results-page">
        <div className="portal-page-header">
          <div>
            <h1>My Results</h1>
          </div>
        </div>

        <div className="alert alert-error">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="student-results-page">

      <div className="portal-page-header">
        <div>
          <h1>My Results</h1>

          <p>
            View your Semester 1 and
            Annual Exam results.
          </p>
        </div>

        <div className="results-year-badge">
          <Award size={18} />

          <span>Academic Year</span>

          <strong>
            {data?.academicYear?.name}
          </strong>
        </div>
      </div>

      <div className="student-results-summary">
        <div>
          <GraduationCap size={22} />

          <span>Class</span>

          <strong>
            {data?.grade?.name}
          </strong>
        </div>

        <div>
          <BookOpen size={22} />

          <span>Admission No.</span>

          <strong>
            {data?.student
              ?.admissionNumber || "—"}
          </strong>
        </div>
      </div>

      <div className="student-results-exams">
        {data?.exams?.map((examGroup) => (
          <section
            className="portal-card student-result-exam-card"
            key={examGroup.exam.id}
          >
            <div className="card-heading-row">
              <div>
                <h2>
                  {examLabel(
                    examGroup.exam.examType
                  )}
                </h2>

                <p>
                  {data.grade.name} exam
                  results
                </p>
              </div>

              <Award size={22} />
            </div>

            {examGroup.results.length ===
            0 ? (
              <div className="empty-state">
                Results have not been
                published yet.
              </div>
            ) : (
              <div className="results-table-wrap">
                <table className="portal-table results-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Marks</th>
                      <th>Maximum</th>
                      <th>Percentage</th>
                      <th>Remarks</th>
                      <th>Teacher</th>
                    </tr>
                  </thead>

                  <tbody>
                    {examGroup.results.map(
                      (result) => (
                        <tr
                          key={
                            result.resultId
                          }
                        >
                          <td>
                            <strong>
                              {
                                result
                                  .subject
                                  .name
                              }
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
                            {result.teacher}
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}