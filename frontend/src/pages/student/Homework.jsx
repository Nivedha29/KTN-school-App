import { useEffect, useState } from "react";
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
  if (!dateString) return "No due date";

  return new Date(dateString).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "UTC",
    }
  );
}

export default function StudentHomework() {
  const [grade, setGrade] = useState(null);
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadHomework() {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE}/homework/student`,
          {
            credentials: "include",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Unable to load homework."
          );
        }

        setGrade(data.grade || null);

        setHomework(
          Array.isArray(data.homework)
            ? data.homework
            : []
        );
      } catch (err) {
        setError(
          err.message ||
            "Unable to load homework."
        );
      } finally {
        setLoading(false);
      }
    }

    loadHomework();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-card">
        <h2>Homework</h2>
        <p>Loading homework...</p>
      </div>
    );
  }

  return (
    <div className="student-homework-page">
      <div className="page-header">
        <div>
          <h1>Homework</h1>

          <p>
            View homework assigned by your
            teachers.
          </p>
        </div>
      </div>

      {error && (
        <div className="portal-alert error">
          {error}
        </div>
      )}

      {grade && (
        <div className="student-homework-grade-card">
          <div className="student-homework-grade-icon">
            <GraduationCap size={22} />
          </div>

          <div>
            <span>Your Class</span>
            <strong>{grade.name}</strong>
          </div>
        </div>
      )}

      {!grade ? (
        <div className="dashboard-card">
          <div className="empty-state">
            <p>
              You are not currently enrolled
              in an active grade.
            </p>
          </div>
        </div>
      ) : homework.length === 0 ? (
        <div className="dashboard-card">
          <div className="empty-state">
            <BookOpen size={30} />

            <p>
              No homework has been assigned
              yet.
            </p>
          </div>
        </div>
      ) : (
        <div className="student-homework-grid">
          {homework.map((item) => (
            <article
              key={item.id}
              className="student-homework-card"
            >
              <div className="student-homework-card-top">
                <div>
                  <span className="student-homework-subject">
                    {item.subject?.name ||
                      "Subject"}
                  </span>

                  <h2>{item.title}</h2>
                </div>

                <BookOpen size={22} />
              </div>

              <p className="student-homework-description">
                {item.description}
              </p>

              <div className="student-homework-meta">
                <div>
                  <CalendarDays size={16} />

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
                  <UserRound size={16} />

                  <span>
                    Teacher{" "}
                    <strong>
                      {item.teacher?.user
                        ?.name || "-"}
                    </strong>
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}