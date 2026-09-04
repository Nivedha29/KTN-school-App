import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  TrendingUp,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";

export default function StudentDashboard() {
  const { user } = useAuth();

  return (
    <div>
      <section className="dashboard-heading">
        <div>
          <p className="eyebrow">
            STUDENT PORTAL
          </p>

          <h1>
            Good evening, {user?.name} 👋
          </h1>

          <p>
            Here's what's happening with your
            learning today.
          </p>
        </div>
      </section>

      <section className="stat-grid">
        <StatCard
          icon={ClipboardList}
          title="Homework"
          value="3"
          subtitle="1 due today"
        />

        <StatCard
          icon={CheckCircle2}
          title="Attendance"
          value="94%"
          subtitle="Excellent"
        />

        <StatCard
          icon={TrendingUp}
          title="Quiz Average"
          value="82%"
          subtitle="+4% this month"
        />

        <StatCard
          icon={BookOpen}
          title="Courses"
          value="6"
          subtitle="Active subjects"
        />
      </section>

      <section className="dashboard-grid">
        <div className="dashboard-card next-class-card">
          <div className="card-heading">
            <div>
              <p className="eyebrow">
                NEXT CLASS
              </p>

              <h2>Mathematics</h2>
            </div>

            <div className="subject-icon">
              <BookOpen />
            </div>
          </div>

          <div className="class-information">
            <div>
              <Clock />
              <span>Today • 7:30 PM</span>
            </div>

            <div>
              <CalendarDays />
              <span>Grade 3A</span>
            </div>
          </div>

          <p>
            Teacher: <strong>Nivedha</strong>
          </p>

          <button className="primary-button">
            View Class
          </button>
        </div>

        <div className="dashboard-card">
          <div className="card-heading">
            <h2>Upcoming</h2>

            <button className="text-button">
              View all
            </button>
          </div>

          <UpcomingItem
            date="03"
            month="SEP"
            title="Mathematics Quiz"
            subtitle="Chapter 3"
          />

          <UpcomingItem
            date="04"
            month="SEP"
            title="Science Homework"
            subtitle="Due tomorrow"
          />

          <UpcomingItem
            date="05"
            month="SEP"
            title="English Class"
            subtitle="7:40 PM"
          />
        </div>
      </section>
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
}) {
  return (
    <div className="stat-card">
      <div className="stat-icon">
        <Icon />
      </div>

      <div>
        <span>{title}</span>
        <strong>{value}</strong>
        <small>{subtitle}</small>
      </div>
    </div>
  );
}

function UpcomingItem({
  date,
  month,
  title,
  subtitle,
}) {
  return (
    <div className="upcoming-item">
      <div className="date-box">
        <strong>{date}</strong>
        <span>{month}</span>
      </div>

      <div>
        <strong>{title}</strong>
        <span>{subtitle}</span>
      </div>
    </div>
  );
}