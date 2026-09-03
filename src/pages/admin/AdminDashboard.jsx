import {
  BookOpen,
  FileText,
  GraduationCap,
  Users,
} from "lucide-react";

export default function AdminDashboard() {
  return (
    <div>
      <section className="dashboard-heading">
        <p className="eyebrow">
          ADMINISTRATION
        </p>

        <h1>School Overview</h1>

        <p>
          Welcome to the KTN Digital School
          administration center.
        </p>
      </section>

      <section className="stat-grid">
        <AdminStat
          icon={GraduationCap}
          value="126"
          title="Students"
        />

        <AdminStat
          icon={Users}
          value="18"
          title="Teachers"
        />

        <AdminStat
          icon={BookOpen}
          value="22"
          title="Classes"
        />

        <AdminStat
          icon={FileText}
          value="7"
          title="Applications"
        />
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-card">
          <h2>School Activity</h2>

          <div className="metric-row">
            <span>Today's Attendance</span>
            <strong>91%</strong>
          </div>

          <div className="metric-row">
            <span>Active Homework</span>
            <strong>14</strong>
          </div>

          <div className="metric-row">
            <span>Upcoming Exams</span>
            <strong>4</strong>
          </div>

          <div className="metric-row">
            <span>Pending Applications</span>
            <strong>7</strong>
          </div>
        </div>

        <div className="dashboard-card">
          <h2>Quick Management</h2>

          <div className="quick-actions">
            <button>+ Add Student</button>
            <button>+ Add Teacher</button>
            <button>+ Create Class</button>
            <button>+ Announcement</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function AdminStat({
  icon: Icon,
  value,
  title,
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        <Icon />
      </div>

      <div>
        <strong>{value}</strong>
        <span>{title}</span>
      </div>
    </div>
  );
}