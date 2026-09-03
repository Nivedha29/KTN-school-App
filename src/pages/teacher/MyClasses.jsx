import { useEffect, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  GraduationCap,
  Layers3,
  School,
  UserRound,
  Users,
  X,
} from "lucide-react";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000/api";

export default function MyClasses() {
  const [teacher, setTeacher] =
    useState(null);

  const [classes, setClasses] =
    useState([]);

  const [totalClasses, setTotalClasses] =
    useState(0);

  const [totalSubjects, setTotalSubjects] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /*
   * Student roster modal state.
   */

  const [selectedClass, setSelectedClass] =
    useState(null);

  const [classStudents, setClassStudents] =
    useState([]);

  const [classSubjects, setClassSubjects] =
    useState([]);

  const [
    studentsLoading,
    setStudentsLoading,
  ] = useState(false);

  const [
    studentsError,
    setStudentsError,
  ] = useState("");

  useEffect(() => {
    loadClasses();
  }, []);

  /* ========================================
     LOAD TEACHER CLASSES
  ======================================== */

  async function loadClasses() {
    try {
      setLoading(true);
      setError("");

      const response =
        await fetch(
          `${API_URL}/teachers/me/classes`,
          {
            credentials: "include",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load your classes."
        );
      }

      setTeacher(
        data.teacher || null
      );

      setClasses(
        Array.isArray(data.classes)
          ? data.classes
          : []
      );

      setTotalClasses(
        data.totalClasses || 0
      );

      setTotalSubjects(
        data.totalSubjects || 0
      );
    } catch (err) {
      console.error(
        "Load teacher classes error:",
        err
      );

      setError(
        err.message ||
          "Unable to load your classes."
      );
    } finally {
      setLoading(false);
    }
  }

  /* ========================================
     OPEN CLASS STUDENTS
  ======================================== */

  async function openStudents(
    classItem
  ) {
    try {
      setStudentsLoading(true);
      setStudentsError("");

      /*
       * Open modal immediately so the
       * teacher gets loading feedback.
       */

      setSelectedClass({
        id: classItem.gradeId,
        name: classItem.gradeName,
        academicYear:
          classItem.academicYear,
      });

      setClassStudents([]);
      setClassSubjects([]);

      const response =
        await fetch(
          `${API_URL}/teachers/me/classes/${classItem.gradeId}/students`,
          {
            credentials: "include",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to load class students."
        );
      }

      setSelectedClass(
        data.class || {
          id: classItem.gradeId,
          name: classItem.gradeName,
          academicYear:
            classItem.academicYear,
        }
      );

      setClassStudents(
        Array.isArray(data.students)
          ? data.students
          : []
      );

      setClassSubjects(
        Array.isArray(data.subjects)
          ? data.subjects
          : []
      );
    } catch (err) {
      console.error(
        "Load class students error:",
        err
      );

      setStudentsError(
        err.message ||
          "Unable to load class students."
      );
    } finally {
      setStudentsLoading(false);
    }
  }

  /* ========================================
     CLOSE STUDENT MODAL
  ======================================== */

  function closeStudents() {
    setSelectedClass(null);
    setClassStudents([]);
    setClassSubjects([]);
    setStudentsError("");
    setStudentsLoading(false);
  }

  if (loading) {
    return (
      <div style={styles.loadingPage}>
        Loading your classes...
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* =====================================
          PAGE HEADER
      ====================================== */}

      <div style={styles.header}>
        <div>
          <span style={styles.eyebrow}>
            TEACHER PORTAL
          </span>

          <h1 style={styles.title}>
            My Classes
          </h1>

          <p style={styles.subtitle}>
            View your assigned KTN
            classes, subjects, and
            enrolled students.
          </p>
        </div>
      </div>

      {/* =====================================
          ERROR
      ====================================== */}

      {error && (
        <div style={styles.error}>
          {error}
        </div>
      )}

      {/* =====================================
          TEACHER INFORMATION
      ====================================== */}

      {teacher && (
        <div style={styles.teacherCard}>
          <div style={styles.teacherAvatar}>
            {teacher.name
              ?.charAt(0)
              ?.toUpperCase() || "T"}
          </div>

          <div style={styles.teacherInfo}>
            <h2 style={styles.teacherName}>
              {teacher.name}
            </h2>

            <div style={styles.teacherMeta}>
              <span>
                Employee No:{" "}
                <strong>
                  {teacher.employeeNumber ||
                    "Not assigned"}
                </strong>
              </span>

              <span>
                {teacher.email}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* =====================================
          SUMMARY
      ====================================== */}

      <div style={styles.summaryGrid}>
        <SummaryCard
          icon={
            <School size={22} />
          }
          label="Assigned Classes"
          value={totalClasses}
        />

        <SummaryCard
          icon={
            <BookOpen size={22} />
          }
          label="Assigned Subjects"
          value={totalSubjects}
        />

        <SummaryCard
          icon={
            <CalendarDays
              size={22}
            />
          }
          label="Academic Year"
          value={
            classes[0]?.academicYear
              ?.name || "—"
          }
        />
      </div>

      {/* =====================================
          NO ASSIGNMENTS
      ====================================== */}

      {!error &&
        classes.length === 0 && (
          <div style={styles.emptyCard}>
            <div style={styles.emptyIcon}>
              <Layers3 size={34} />
            </div>

            <h2 style={styles.emptyTitle}>
              No classes assigned yet
            </h2>

            <p style={styles.emptyText}>
              You do not currently have
              any subjects assigned for
              the active academic year.
              Please contact the KTN
              administrator if you believe
              this is incorrect.
            </p>
          </div>
        )}

      {/* =====================================
          CLASSES
      ====================================== */}

      {classes.length > 0 && (
        <>
          <div style={styles.sectionHeader}>
            <div>
              <h2
                style={
                  styles.sectionTitle
                }
              >
                Assigned Classes
              </h2>

              <p
                style={
                  styles.sectionSubtitle
                }
              >
                Your subjects are grouped
                by KTN class.
              </p>
            </div>
          </div>

          <div style={styles.classGrid}>
            {classes.map(
              (classItem) => (
                <article
                  key={
                    classItem.gradeId
                  }
                  style={styles.classCard}
                >
                  {/* CLASS HEADER */}

                  <div
                    style={
                      styles.classCardHeader
                    }
                  >
                    <div
                      style={
                        styles.classIcon
                      }
                    >
                      <GraduationCap
                        size={24}
                      />
                    </div>

                    <div>
                      <h2
                        style={
                          styles.className
                        }
                      >
                        {
                          classItem.gradeName
                        }
                      </h2>

                      <span
                        style={
                          styles.academicYear
                        }
                      >
                        {
                          classItem
                            .academicYear
                            ?.name
                        }
                      </span>
                    </div>
                  </div>

                  {/* SUBJECT COUNT */}

                  <div
                    style={
                      styles.subjectCount
                    }
                  >
                    <BookOpen
                      size={16}
                    />

                    <span>
                      {classItem.subjects
                        ?.length || 0}{" "}
                      {classItem.subjects
                        ?.length === 1
                        ? "Subject"
                        : "Subjects"}
                    </span>
                  </div>

                  {/* SUBJECTS */}

                  <div
                    style={
                      styles.subjectList
                    }
                  >
                    {classItem.subjects?.map(
                      (subject) => (
                        <div
                          key={
                            subject.subjectId
                          }
                          style={
                            styles.subjectRow
                          }
                        >
                          <div
                            style={
                              styles.subjectIcon
                            }
                          >
                            <BookOpen
                              size={17}
                            />
                          </div>

                          <div>
                            <strong
                              style={
                                styles.subjectName
                              }
                            >
                              {
                                subject.subjectName
                              }
                            </strong>

                            <div
                              style={
                                styles.subjectLabel
                              }
                            >
                              {
                                classItem.gradeName
                              }
                            </div>
                          </div>
                        </div>
                      )
                    )}
                  </div>

                  {/* VIEW STUDENTS */}

                  <div
                    style={
                      styles.classActions
                    }
                  >
                    <button
                      type="button"
                      style={
                        styles.viewStudentsButton
                      }
                      onClick={() =>
                        openStudents(
                          classItem
                        )
                      }
                    >
                      <Users size={17} />

                      View Students
                    </button>
                  </div>
                </article>
              )
            )}
          </div>
        </>
      )}

      {/* =====================================
          STUDENT ROSTER MODAL
      ====================================== */}

      {selectedClass && (
        <div
          style={styles.modalOverlay}
          onMouseDown={
            closeStudents
          }
        >
          <div
            style={styles.modal}
            onMouseDown={(event) =>
              event.stopPropagation()
            }
          >
            {/* MODAL HEADER */}

            <div
              style={
                styles.modalHeader
              }
            >
              <div>
                <span
                  style={
                    styles.modalEyebrow
                  }
                >
                  CLASS ROSTER
                </span>

                <h2
                  style={
                    styles.modalTitle
                  }
                >
                  {
                    selectedClass.name
                  }
                </h2>

                <p
                  style={
                    styles.modalSubtitle
                  }
                >
                  {selectedClass
                    .academicYear?.name ||
                    ""}
                </p>
              </div>

              <button
                type="button"
                aria-label="Close"
                style={
                  styles.closeButton
                }
                onClick={
                  closeStudents
                }
              >
                <X size={21} />
              </button>
            </div>

            {/* SUBJECTS */}

            {!studentsLoading &&
              !studentsError &&
              classSubjects.length >
                0 && (
                <div
                  style={
                    styles.modalSubjects
                  }
                >
                  <span
                    style={
                      styles.modalSubjectLabel
                    }
                  >
                    Your subjects:
                  </span>

                  <div
                    style={
                      styles.subjectBadges
                    }
                  >
                    {classSubjects.map(
                      (subject) => (
                        <span
                          key={
                            subject.id
                          }
                          style={
                            styles.subjectBadge
                          }
                        >
                          {
                            subject.name
                          }
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}

            {/* LOADING */}

            {studentsLoading && (
              <div
                style={
                  styles.modalLoading
                }
              >
                Loading students...
              </div>
            )}

            {/* ERROR */}

            {!studentsLoading &&
              studentsError && (
                <div
                  style={
                    styles.modalError
                  }
                >
                  {studentsError}
                </div>
              )}

            {/* EMPTY CLASS */}

            {!studentsLoading &&
              !studentsError &&
              classStudents.length ===
                0 && (
                <div
                  style={
                    styles.emptyStudents
                  }
                >
                  <div
                    style={
                      styles.emptyStudentsIcon
                    }
                  >
                    <Users size={30} />
                  </div>

                  <h3
                    style={
                      styles.emptyStudentsTitle
                    }
                  >
                    No students enrolled
                  </h3>

                  <p
                    style={
                      styles.emptyStudentsText
                    }
                  >
                    There are currently
                    no active students
                    enrolled in{" "}
                    {
                      selectedClass.name
                    }.
                  </p>
                </div>
              )}

            {/* STUDENTS */}

            {!studentsLoading &&
              !studentsError &&
              classStudents.length >
                0 && (
                <>
                  <div
                    style={
                      styles.rosterSummary
                    }
                  >
                    <Users size={17} />

                    <strong>
                      {
                        classStudents.length
                      }
                    </strong>

                    <span>
                      {classStudents.length ===
                      1
                        ? "Student"
                        : "Students"}
                    </span>
                  </div>

                  <div
                    style={
                      styles.studentList
                    }
                  >
                    {classStudents.map(
                      (
                        student,
                        index
                      ) => (
                        <div
                          key={
                            student.id
                          }
                          style={
                            styles.studentRow
                          }
                        >
                          <div
                            style={
                              styles.studentNumber
                            }
                          >
                            {index + 1}
                          </div>

                          <div
                            style={
                              styles.studentAvatar
                            }
                          >
                            <UserRound
                              size={19}
                            />
                          </div>

                          <div
                            style={
                              styles.studentInfo
                            }
                          >
                            <strong
                              style={
                                styles.studentName
                              }
                            >
                              {
                                student.name
                              }
                            </strong>

                            <div
                              style={
                                styles.studentMeta
                              }
                            >
                              <span>
                                Admission
                                No:{" "}
                                {student.admissionNumber ||
                                  "—"}
                              </span>

                              {student.gender && (
                                <span>
                                  {
                                    student.gender
                                  }
                                </span>
                              )}
                            </div>

                            {(student.currentSchool ||
                              student.currentSchoolGrade) && (
                              <div
                                style={
                                  styles.schoolInfo
                                }
                              >
                                Current
                                School:{" "}
                                {student.currentSchool ||
                                  "—"}

                                {student.currentSchoolGrade
                                  ? ` • ${student.currentSchoolGrade}`
                                  : ""}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    )}
                  </div>
                </>
              )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ========================================
   SUMMARY CARD
======================================== */

function SummaryCard({
  icon,
  label,
  value,
}) {
  return (
    <div style={styles.summaryCard}>
      <div style={styles.summaryIcon}>
        {icon}
      </div>

      <div>
        <div style={styles.summaryValue}>
          {value}
        </div>

        <div style={styles.summaryLabel}>
          {label}
        </div>
      </div>
    </div>
  );
}

/* ========================================
   STYLES
======================================== */

const styles = {
  page: {
    width: "100%",
  },

  loadingPage: {
    padding: "30px",
    color: "#64748b",
  },

  header: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent:
      "space-between",
    gap: "20px",
    marginBottom: "24px",
  },

  eyebrow: {
    display: "block",
    marginBottom: "6px",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0.12em",
    color: "#64748b",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    lineHeight: 1.2,
    color: "#0f172a",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#64748b",
    lineHeight: 1.6,
  },

  error: {
    marginBottom: "20px",
    padding: "14px 16px",
    border:
      "1px solid #fecaca",
    borderRadius: "10px",
    background: "#fef2f2",
    color: "#991b1b",
  },

  teacherCard: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "20px",
    marginBottom: "20px",
    border:
      "1px solid #e2e8f0",
    borderRadius: "14px",
    background: "#ffffff",
  },

  teacherAvatar: {
    width: "52px",
    height: "52px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    flexShrink: 0,
    borderRadius: "50%",
    background: "#eef2ff",
    color: "#3730a3",
    fontSize: "21px",
    fontWeight: 800,
  },

  teacherInfo: {
    minWidth: 0,
  },

  teacherName: {
    margin: 0,
    fontSize: "19px",
    color: "#0f172a",
  },

  teacherMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px 20px",
    marginTop: "6px",
    color: "#64748b",
    fontSize: "14px",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(190px, 1fr))",
    gap: "16px",
    marginBottom: "28px",
  },

  summaryCard: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    padding: "18px",
    border:
      "1px solid #e2e8f0",
    borderRadius: "14px",
    background: "#ffffff",
  },

  summaryIcon: {
    width: "44px",
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    flexShrink: 0,
    borderRadius: "12px",
    background: "#f1f5f9",
    color: "#334155",
  },

  summaryValue: {
    fontSize: "21px",
    fontWeight: 800,
    color: "#0f172a",
  },

  summaryLabel: {
    marginTop: "2px",
    fontSize: "13px",
    color: "#64748b",
  },

  sectionHeader: {
    marginBottom: "16px",
  },

  sectionTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#0f172a",
  },

  sectionSubtitle: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "14px",
  },

  classGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "18px",
  },

  classCard: {
    overflow: "hidden",
    border:
      "1px solid #e2e8f0",
    borderRadius: "14px",
    background: "#ffffff",
  },

  classCardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    padding: "18px",
    borderBottom:
      "1px solid #f1f5f9",
  },

  classIcon: {
    width: "46px",
    height: "46px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    flexShrink: 0,
    borderRadius: "12px",
    background: "#eef2ff",
    color: "#3730a3",
  },

  className: {
    margin: 0,
    fontSize: "19px",
    color: "#0f172a",
  },

  academicYear: {
    display: "block",
    marginTop: "3px",
    fontSize: "13px",
    color: "#64748b",
  },

  subjectCount: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "12px 18px",
    background: "#f8fafc",
    color: "#475569",
    fontSize: "13px",
    fontWeight: 600,
  },

  subjectList: {
    padding: "8px 18px 12px",
  },

  subjectRow: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    padding: "12px 0",
    borderBottom:
      "1px solid #f1f5f9",
  },

  subjectIcon: {
    width: "34px",
    height: "34px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    flexShrink: 0,
    borderRadius: "9px",
    background: "#f8fafc",
    color: "#475569",
  },

  subjectName: {
    display: "block",
    color: "#0f172a",
    fontSize: "14px",
  },

  subjectLabel: {
    marginTop: "2px",
    color: "#94a3b8",
    fontSize: "12px",
  },

  classActions: {
    padding: "14px 18px 18px",
  },

  viewStudentsButton: {
    width: "100%",
    minHeight: "42px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    gap: "8px",
    border: "none",
    borderRadius: "10px",
    background: "#0f172a",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
  },

  emptyCard: {
    padding: "48px 24px",
    border:
      "1px solid #e2e8f0",
    borderRadius: "14px",
    background: "#ffffff",
    textAlign: "center",
  },

  emptyIcon: {
    width: "64px",
    height: "64px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    margin: "0 auto 16px",
    borderRadius: "50%",
    background: "#f1f5f9",
    color: "#64748b",
  },

  emptyTitle: {
    margin: 0,
    fontSize: "20px",
    color: "#0f172a",
  },

  emptyText: {
    maxWidth: "520px",
    margin: "9px auto 0",
    color: "#64748b",
    lineHeight: 1.6,
  },

  /* ======================================
     MODAL
  ====================================== */

  modalOverlay: {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    padding: "20px",
    background:
      "rgba(15, 23, 42, 0.58)",
  },

  modal: {
    width: "100%",
    maxWidth: "760px",
    maxHeight: "88vh",
    overflowY: "auto",
    borderRadius: "16px",
    background: "#ffffff",
    boxShadow:
      "0 24px 70px rgba(15, 23, 42, 0.25)",
  },

  modalHeader: {
    position: "sticky",
    top: 0,
    zIndex: 2,
    display: "flex",
    alignItems:
      "flex-start",
    justifyContent:
      "space-between",
    gap: "20px",
    padding: "20px 22px",
    borderBottom:
      "1px solid #e2e8f0",
    background: "#ffffff",
  },

  modalEyebrow: {
    display: "block",
    marginBottom: "4px",
    fontSize: "11px",
    fontWeight: 800,
    letterSpacing: "0.1em",
    color: "#64748b",
  },

  modalTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "22px",
  },

  modalSubtitle: {
    margin: "4px 0 0",
    color: "#64748b",
    fontSize: "13px",
  },

  closeButton: {
    width: "38px",
    height: "38px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    flexShrink: 0,
    border:
      "1px solid #e2e8f0",
    borderRadius: "10px",
    background: "#ffffff",
    color: "#475569",
    cursor: "pointer",
  },

  modalSubjects: {
    padding: "16px 22px",
    borderBottom:
      "1px solid #f1f5f9",
    background: "#f8fafc",
  },

  modalSubjectLabel: {
    display: "block",
    marginBottom: "8px",
    color: "#475569",
    fontSize: "13px",
    fontWeight: 600,
  },

  subjectBadges: {
    display: "flex",
    flexWrap: "wrap",
    gap: "7px",
  },

  subjectBadge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "6px 10px",
    borderRadius: "999px",
    background: "#eef2ff",
    color: "#3730a3",
    fontSize: "12px",
    fontWeight: 700,
  },

  modalLoading: {
    padding: "50px 22px",
    color: "#64748b",
    textAlign: "center",
  },

  modalError: {
    margin: "20px",
    padding: "14px 16px",
    border:
      "1px solid #fecaca",
    borderRadius: "10px",
    background: "#fef2f2",
    color: "#991b1b",
  },

  rosterSummary: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    padding: "16px 22px",
    color: "#475569",
    fontSize: "14px",
  },

  studentList: {
    padding: "0 22px 22px",
  },

  studentRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "15px 0",
    borderBottom:
      "1px solid #e2e8f0",
  },

  studentNumber: {
    width: "28px",
    flexShrink: 0,
    color: "#94a3b8",
    fontSize: "13px",
    textAlign: "center",
  },

  studentAvatar: {
    width: "42px",
    height: "42px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    flexShrink: 0,
    borderRadius: "50%",
    background: "#f1f5f9",
    color: "#475569",
  },

  studentInfo: {
    flex: 1,
    minWidth: 0,
  },

  studentName: {
    display: "block",
    color: "#0f172a",
    fontSize: "14px",
  },

  studentMeta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "4px 14px",
    marginTop: "4px",
    color: "#64748b",
    fontSize: "12px",
  },

  schoolInfo: {
    marginTop: "4px",
    color: "#94a3b8",
    fontSize: "12px",
  },

  emptyStudents: {
    padding: "48px 24px",
    textAlign: "center",
  },

  emptyStudentsIcon: {
    width: "58px",
    height: "58px",
    display: "flex",
    alignItems: "center",
    justifyContent:
      "center",
    margin: "0 auto 14px",
    borderRadius: "50%",
    background: "#f1f5f9",
    color: "#64748b",
  },

  emptyStudentsTitle: {
    margin: 0,
    color: "#0f172a",
    fontSize: "18px",
  },

  emptyStudentsText: {
    margin: "7px 0 0",
    color: "#64748b",
    lineHeight: 1.6,
  },
};