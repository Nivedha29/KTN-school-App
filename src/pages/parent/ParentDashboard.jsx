import {
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  GraduationCap,
  Megaphone,
  TrendingUp,
  UserRound,
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

const API_BASE =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

/* ========================================
   HELPERS
======================================== */

function getStatusLabel(status) {
  const labels = {
    PENDING: "Pending",
    APPROVED: "Approved",
    REJECTED: "Rejected",
  };

  return (
    labels[status] ||
    "Not Submitted"
  );
}

function getActiveEnrollment(child) {
  const enrollments =
    child?.student?.enrollments;

  if (
    !Array.isArray(enrollments) ||
    enrollments.length === 0
  ) {
    return null;
  }

  return enrollments[0];
}

function getAttendanceSummary(data) {
  if (!data?.summary) {
    return {
      percentage: null,
      total: 0,
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    };
  }

  return {
    percentage:
      data.summary.attendanceRate ??
      null,

    total:
      data.summary.total ?? 0,

    present:
      data.summary.PRESENT ?? 0,

    absent:
      data.summary.ABSENT ?? 0,

    late:
      data.summary.LATE ?? 0,

    excused:
      data.summary.EXCUSED ?? 0,
  };
}

/*
 * Parent Results API:
 *
 * data.exams = [
 *   {
 *     exam: {...},
 *     results: [...]
 *   }
 * ]
 */

function calculateLatestResult(data) {
  const exams =
    Array.isArray(data?.exams)
      ? data.exams
      : [];

  if (exams.length === 0) {
    return null;
  }

  /*
   * Walk backwards so the most recent
   * available exam group is used.
   */

  for (
    let index = exams.length - 1;
    index >= 0;
    index -= 1
  ) {
    const examGroup =
      exams[index];

    const examResults =
      Array.isArray(
        examGroup?.results
      )
        ? examGroup.results
        : [];

    if (
      examResults.length === 0
    ) {
      continue;
    }

    const totalMarks =
      examResults.reduce(
        (sum, result) =>
          sum +
          Number(
            result.marksObtained ||
              0
          ),
        0
      );

    const maximumMarks =
      examResults.reduce(
        (sum, result) =>
          sum +
          Number(
            result.maxMarks ||
              0
          ),
        0
      );

    if (maximumMarks <= 0) {
      continue;
    }

    return Math.round(
      (totalMarks /
        maximumMarks) *
        100
    );
  }

  return null;
}

/* ========================================
   COMPONENT
======================================== */

export default function ParentDashboard() {
  const [
    children,
    setChildren,
  ] = useState([]);

  const [
    selectedChildId,
    setSelectedChildId,
  ] = useState("");

  const [
    attendance,
    setAttendance,
  ] = useState(null);

  const [
    homework,
    setHomework,
  ] = useState([]);

  const [
    results,
    setResults,
  ] = useState(null);

  const [
    notices,
    setNotices,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    childDataLoading,
    setChildDataLoading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* ========================================
     LOAD CHILDREN + SCHOOL NOTICES
  ======================================== */

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [
          childrenResponse,
          noticesResponse,
        ] = await Promise.all([
          fetch(
            `${API_BASE}/parents/me/children`,
            {
              credentials:
                "include",
            }
          ),

          fetch(
            `${API_BASE}/notices`,
            {
              credentials:
                "include",
            }
          ),
        ]);

        const childrenData =
          await childrenResponse.json();

        const noticesData =
          await noticesResponse.json();

        if (!childrenResponse.ok) {
          throw new Error(
            childrenData.message ||
              "Unable to load children."
          );
        }

        const loadedChildren =
          Array.isArray(
            childrenData
          )
            ? childrenData
            : [];

        setChildren(
          loadedChildren
        );

        if (
          loadedChildren.length > 0
        ) {
          setSelectedChildId(
            String(
              loadedChildren[0]
                .student.id
            )
          );
        } else {
          setSelectedChildId("");
        }

        if (noticesResponse.ok) {
          setNotices(
            Array.isArray(
              noticesData.notices
            )
              ? noticesData.notices
              : []
          );
        } else {
          /*
           * Notices should not prevent
           * the rest of the parent
           * dashboard from loading.
           */

          setNotices([]);
        }
      } catch (err) {
        console.error(err);

        setChildren([]);
        setSelectedChildId("");
        setNotices([]);

        setError(
          err.message ||
            "Unable to load parent dashboard."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  /* ========================================
     SELECTED CHILD
  ======================================== */

  const selectedChild =
    useMemo(() => {
      return children.find(
        (child) =>
          String(
            child.student.id
          ) ===
          String(
            selectedChildId
          )
      );
    }, [
      children,
      selectedChildId,
    ]);

  const enrollment =
    useMemo(
      () =>
        getActiveEnrollment(
          selectedChild
        ),
      [selectedChild]
    );

  /* ========================================
     LOAD SELECTED CHILD PROGRESS
  ======================================== */

  useEffect(() => {
    if (!selectedChildId) {
      setAttendance(null);
      setHomework([]);
      setResults(null);

      return;
    }

    async function loadChildData() {
      try {
        setChildDataLoading(
          true
        );

        /*
         * Clear the previous child's
         * academic information before
         * loading the newly selected
         * child.
         */

        setAttendance(null);
        setHomework([]);
        setResults(null);

        const [
          attendanceResponse,
          homeworkResponse,
          resultsResponse,
        ] = await Promise.all([
          fetch(
            `${API_BASE}/attendance/parent/child/${selectedChildId}`,
            {
              credentials:
                "include",
            }
          ),

          fetch(
            `${API_BASE}/homework/parent/child/${selectedChildId}`,
            {
              credentials:
                "include",
            }
          ),

          fetch(
            `${API_BASE}/results/parent/child/${selectedChildId}`,
            {
              credentials:
                "include",
            }
          ),
        ]);

        /*
         * A newly registered child can
         * legitimately have no KTN
         * enrollment yet.
         *
         * Therefore an individual
         * academic endpoint failure
         * should not break the entire
         * dashboard.
         */

        if (attendanceResponse.ok) {
          const attendanceData =
            await attendanceResponse.json();

          setAttendance(
            attendanceData
          );
        } else {
          setAttendance(null);
        }

        if (homeworkResponse.ok) {
          const homeworkData =
            await homeworkResponse.json();

          setHomework(
            Array.isArray(
              homeworkData.homework
            )
              ? homeworkData.homework
              : []
          );
        } else {
          setHomework([]);
        }

        if (resultsResponse.ok) {
          const resultsData =
            await resultsResponse.json();

          setResults(
            resultsData
          );
        } else {
          setResults(null);
        }
      } catch (err) {
        console.error(
          "Parent dashboard progress error:",
          err
        );

        setAttendance(null);
        setHomework([]);
        setResults(null);

        setError(
          "Unable to load child progress."
        );
      } finally {
        setChildDataLoading(
          false
        );
      }
    }

    loadChildData();
  }, [selectedChildId]);

  /* ========================================
     STATISTICS
  ======================================== */

  const attendanceSummary =
    useMemo(
      () =>
        getAttendanceSummary(
          attendance
        ),
      [attendance]
    );

  const latestResult =
    useMemo(
      () =>
        calculateLatestResult(
          results
        ),
      [results]
    );

  const homeworkCount =
    homework.length;

  /* ========================================
     INITIAL LOADING
  ======================================== */

  if (loading) {
    return (
      <div>
        <section className="dashboard-heading">
          <p className="eyebrow">
            PARENT PORTAL
          </p>

          <h1>
            My Child&apos;s Progress
          </h1>

          <p>
            Loading your children...
          </p>
        </section>
      </div>
    );
  }

  /* ========================================
     NO LINKED CHILDREN
  ======================================== */

  if (
    children.length === 0
  ) {
    return (
      <div>
        <section className="dashboard-heading">
          <p className="eyebrow">
            PARENT PORTAL
          </p>

          <h1>
            My Child&apos;s Progress
          </h1>

          <p>
            View your child&apos;s KTN
            learning progress.
          </p>
        </section>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <section className="dashboard-card">
          <div className="empty-state">
            <UserRound size={38} />

            <h2>
              No children registered
            </h2>

            <p>
              Add your child from the
              My Children page to submit
              an admission request.
            </p>
          </div>
        </section>
      </div>
    );
  }

  /* ========================================
     DASHBOARD
  ======================================== */

  return (
    <div>
      {/* PAGE HEADER */}

      <section className="dashboard-heading">
        <p className="eyebrow">
          PARENT PORTAL
        </p>

        <h1>
          {selectedChild?.student?.name
            ? `${selectedChild.student.name}'s Progress`
            : "My Child's Progress"}
        </h1>

        <p>
          {enrollment?.grade?.name
            ? `${enrollment.grade.name} • ${
                enrollment.grade
                  .academicYear
                  ?.name ||
                "Current Academic Year"
              }`
            : "KTN class not assigned yet"}
        </p>
      </section>

      {/* CHILD SELECTOR */}

      <section className="dashboard-card">
        <div className="card-heading-row">
          <div>
            <h2>
              Select Child
            </h2>

            <p>
              Choose a child to view
              their school progress.
            </p>
          </div>

          <GraduationCap
            size={24}
          />
        </div>

        <div className="form-group">
          <label htmlFor="dashboard-child">
            Child
          </label>

          <select
            id="dashboard-child"
            value={
              selectedChildId
            }
            onChange={(event) =>
              setSelectedChildId(
                event.target.value
              )
            }
          >
            {children.map(
              (child) => {
                const childEnrollment =
                  getActiveEnrollment(
                    child
                  );

                return (
                  <option
                    key={
                      child.student.id
                    }
                    value={
                      child.student.id
                    }
                  >
                    {child.student.name ||
                      "Unnamed Student"}

                    {childEnrollment
                      ?.grade?.name
                      ? ` — ${childEnrollment.grade.name}`
                      : " — No KTN class"}
                  </option>
                );
              }
            )}
          </select>
        </div>
      </section>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {/* STUDENT INFORMATION */}

      <section className="dashboard-card">
        <div className="card-heading-row">
          <div>
            <h2>
              Student Information
            </h2>

            <p>
              Admission and current
              enrollment information.
            </p>
          </div>

          <BookOpen size={23} />
        </div>

        <div className="dashboard-info-grid">
          <DashboardInfo
            label="Admission Status"
            value={getStatusLabel(
              selectedChild
                ?.admissionStatus
            )}
          />

          <DashboardInfo
            label="KTN Class"
            value={
              enrollment?.grade?.name ||
              "Not assigned"
            }
          />

          <DashboardInfo
            label="Academic Year"
            value={
              enrollment?.grade
                ?.academicYear?.name ||
              "Not assigned"
            }
          />

          <DashboardInfo
            label="Current School"
            value={
              selectedChild?.student
                ?.schoolName ||
              "Not provided"
            }
          />

          <DashboardInfo
            label="Current School Grade"
            value={
              selectedChild?.student
                ?.schoolGrade ||
              "Not provided"
            }
          />

          <DashboardInfo
            label="Admission Number"
            value={
              selectedChild?.student
                ?.admissionNumber ||
              "Not assigned"
            }
          />
        </div>
      </section>

      {/* ENROLLED CHILD */}

      {enrollment ? (
        <>
          <section className="stat-grid">
            <ParentStat
              title="Attendance"
              value={
                childDataLoading
                  ? "..."
                  : attendanceSummary
                        .percentage !==
                      null
                    ? `${attendanceSummary.percentage}%`
                    : "No data"
              }
              icon={
                ClipboardCheck
              }
            />

            <ParentStat
              title="Homework"
              value={
                childDataLoading
                  ? "..."
                  : String(
                      homeworkCount
                    )
              }
              icon={
                CheckCircle2
              }
            />

            <ParentStat
              title="Latest Result"
              value={
                childDataLoading
                  ? "..."
                  : latestResult !==
                      null
                    ? `${latestResult}%`
                    : "No data"
              }
              icon={
                TrendingUp
              }
            />

            <ParentStat
              title="Notices"
              value={String(
                notices.length
              )}
              icon={
                Megaphone
              }
            />
          </section>

          <section className="dashboard-grid">
            {/* ACADEMIC SUMMARY */}

            <div className="dashboard-card">
              <h2>
                Academic Summary
              </h2>

              <Activity
                icon={
                  CalendarCheck
                }
                text={
                  attendanceSummary.total >
                  0
                    ? `${attendanceSummary.total} attendance record${
                        attendanceSummary.total ===
                        1
                          ? ""
                          : "s"
                      } available`
                    : "No attendance records available yet"
                }
              />

              <Activity
                icon={
                  ClipboardCheck
                }
                text={
                  attendanceSummary.total >
                  0
                    ? `${attendanceSummary.present} present • ${attendanceSummary.absent} absent • ${attendanceSummary.late} late • ${attendanceSummary.excused} excused`
                    : "Attendance summary is not available yet"
                }
              />

              <Activity
                icon={
                  BookOpen
                }
                text={
                  homeworkCount > 0
                    ? `${homeworkCount} homework item${
                        homeworkCount ===
                        1
                          ? ""
                          : "s"
                      } available`
                    : "No homework available"
                }
              />

              <Activity
                icon={
                  TrendingUp
                }
                text={
                  latestResult !==
                  null
                    ? `Latest exam average: ${latestResult}%`
                    : "No exam results available yet"
                }
              />
            </div>

            {/* NOTICES */}

            <div className="dashboard-card">
              <h2>
                Latest Notices
              </h2>

              {notices.length ===
              0 ? (
                <div className="empty-state">
                  No active school
                  notices.
                </div>
              ) : (
                notices
                  .slice(0, 3)
                  .map(
                    (notice) => (
                      <Activity
                        key={
                          notice.id
                        }
                        icon={
                          Megaphone
                        }
                        text={
                          notice.title
                        }
                      />
                    )
                  )
              )}
            </div>
          </section>
        </>
      ) : (
        /* NOT YET ENROLLED */

        <section className="dashboard-card">
          <div className="empty-state">
            <ClipboardCheck
              size={38}
            />

            <h2>
              {selectedChild
                ?.admissionStatus ===
              "REJECTED"
                ? "Admission not approved"
                : "KTN enrollment pending"}
            </h2>

            <p>
              {selectedChild
                ?.admissionStatus ===
              "REJECTED"
                ? "This admission request was not approved. Please contact KTN Digital School for further information."
                : "Academic progress will appear here after the admission is approved and the child is assigned to a KTN class."}
            </p>
          </div>
        </section>
      )}
    </div>
  );
}

/* ========================================
   COMPONENTS
======================================== */

function ParentStat({
  title,
  value,
  icon: Icon,
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        <Icon />
      </div>

      <div>
        <span>
          {title}
        </span>

        <strong>
          {value}
        </strong>
      </div>
    </div>
  );
}

function Activity({
  icon: Icon,
  text,
}) {
  return (
    <div className="activity-row">
      <Icon size={20} />

      <span>
        {text}
      </span>
    </div>
  );
}

function DashboardInfo({
  label,
  value,
}) {
  return (
    <div className="dashboard-info-item">
      <span>
        {label}
      </span>

      <strong>
        {value}
      </strong>
    </div>
  );
}