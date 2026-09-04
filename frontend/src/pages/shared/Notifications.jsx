import { useEffect, useState } from "react";
import {
  Bell,
  CalendarDays,
  RefreshCw,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

function formatDate(value) {
  if (!value) return "No expiry";

  const date = new Date(value);

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Notifications() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadNotices() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/notices`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load notifications."
        );
      }

      setNotices(data.notices || []);
    } catch (err) {
      setError(
        err.message || "Failed to load notifications."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotices();
  }, []);

  return (
    <div className="shared-notifications-page">
      <div className="portal-page-header">
        <div>
          <h1>Notifications</h1>

          <p>
            View the latest school announcements and important
            updates.
          </p>
        </div>

        <button
          type="button"
          className="secondary-button"
          onClick={loadNotices}
          disabled={loading}
        >
          <RefreshCw size={17} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="portal-alert error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="portal-card">
          <div className="empty-state">
            Loading notifications...
          </div>
        </div>
      ) : notices.length === 0 ? (
        <div className="portal-card">
          <div className="empty-state">
            <Bell size={40} />

            <h3>No notifications</h3>

            <p>
              There are no active school announcements at
              this time.
            </p>
          </div>
        </div>
      ) : (
        <div className="shared-notifications-list">
          {notices.map((notice) => (
            <article
              key={notice.id}
              className="shared-notification-card"
            >
              <div className="shared-notification-icon">
                <Bell size={21} />
              </div>

              <div className="shared-notification-content">
                <div className="shared-notification-heading">
                  <h2>{notice.title}</h2>

                  <span className="notice-status active">
                    Active
                  </span>
                </div>

                <p className="shared-notification-message">
                  {notice.message}
                </p>

                <div className="shared-notification-meta">
                  <span>
                    <CalendarDays size={15} />
                    Published {formatDate(notice.createdAt)}
                  </span>

                  {notice.expiresAt && (
                    <span>
                      <CalendarDays size={15} />
                      Expires {formatDate(notice.expiresAt)}
                    </span>
                  )}

                  {notice.createdBy?.name && (
                    <span>
                      By {notice.createdBy.name}
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}