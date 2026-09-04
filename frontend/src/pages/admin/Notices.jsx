import { useEffect, useState } from "react";
import {
  Bell,
  CalendarDays,
  Edit3,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

const API_URL = "http://localhost:5000/api";

const emptyForm = {
  title: "",
  message: "",
  expiresAt: "",
};

function formatDate(value) {
  if (!value) return "No expiry";

  const date = new Date(value);

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function Notices() {
  const [notices, setNotices] = useState([]);
  const [form, setForm] = useState(emptyForm);

  const [editingNotice, setEditingNotice] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);

  async function loadNotices() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API_URL}/notices/admin`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to load notices.");
      }

      setNotices(data.notices || []);
    } catch (err) {
      setError(err.message || "Failed to load notices.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadNotices();
  }, []);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  function resetForm() {
    setForm(emptyForm);
    setEditingNotice(null);
    setShowForm(false);
  }

  function startCreate() {
    setError("");
    setSuccess("");
    setEditingNotice(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function startEdit(notice) {
    setError("");
    setSuccess("");

    setEditingNotice(notice);

    setForm({
      title: notice.title || "",
      message: notice.message || "",
      expiresAt: notice.expiresAt
        ? new Date(notice.expiresAt).toISOString().slice(0, 10)
        : "",
    });

    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.title.trim()) {
      setError("Notice title is required.");
      return;
    }

    if (!form.message.trim()) {
      setError("Notice message is required.");
      return;
    }

    try {
      setSaving(true);

      const isEditing = Boolean(editingNotice);

      const url = isEditing
        ? `${API_URL}/notices/admin/${editingNotice.id}`
        : `${API_URL}/notices/admin`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",

        headers: {
          "Content-Type": "application/json",
        },

        credentials: "include",

        body: JSON.stringify({
          title: form.title.trim(),
          message: form.message.trim(),
          expiresAt: form.expiresAt || null,
          ...(isEditing
            ? {
                isActive: editingNotice.isActive,
              }
            : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            (isEditing
              ? "Failed to update notice."
              : "Failed to create notice.")
        );
      }

      setSuccess(
        isEditing
          ? "Notice updated successfully."
          : "Notice created successfully."
      );

      resetForm();
      await loadNotices();
    } catch (err) {
      setError(err.message || "Failed to save notice.");
    } finally {
      setSaving(false);
    }
  }

  async function deactivateNotice(notice) {
    const confirmed = window.confirm(
      `Remove "${notice.title}" from active notices?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/notices/admin/${notice.id}`,
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to remove notice.");
      }

      setSuccess("Notice removed successfully.");

      await loadNotices();
    } catch (err) {
      setError(err.message || "Failed to remove notice.");
    }
  }

  async function reactivateNotice(notice) {
    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/notices/admin/${notice.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            isActive: true,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to reactivate notice."
        );
      }

      setSuccess("Notice activated successfully.");

      await loadNotices();
    } catch (err) {
      setError(err.message || "Failed to activate notice.");
    }
  }

  return (
    <div className="admin-notices-page">
      <div className="portal-page-header">
        <div>
          <h1>Notices</h1>

          <p>
            Create and manage school-wide announcements for teachers,
            students, and parents.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={startCreate}
        >
          <Plus size={18} />
          New Notice
        </button>
      </div>

      {error && (
        <div className="portal-alert error">
          {error}
        </div>
      )}

      {success && (
        <div className="portal-alert success">
          {success}
        </div>
      )}

      {showForm && (
        <div className="portal-card notice-form-card">
          <div className="card-heading-row">
            <div>
              <h2>
                {editingNotice
                  ? "Edit Notice"
                  : "Create Notice"}
              </h2>

              <p>
                This notice will be visible across the school portal.
              </p>
            </div>

            <button
              type="button"
              className="icon-button"
              onClick={resetForm}
              aria-label="Close notice form"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="notice-title">
                Title
              </label>

              <input
                id="notice-title"
                name="title"
                type="text"
                value={form.title}
                onChange={handleChange}
                placeholder="Enter notice title"
                maxLength={150}
              />
            </div>

            <div className="form-group">
              <label htmlFor="notice-message">
                Message
              </label>

              <textarea
                id="notice-message"
                name="message"
                value={form.message}
                onChange={handleChange}
                placeholder="Enter announcement details"
                rows={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="notice-expiry">
                Expiry Date
              </label>

              <input
                id="notice-expiry"
                name="expiresAt"
                type="date"
                value={form.expiresAt}
                onChange={handleChange}
              />

              <span className="field-help">
                Leave blank if the notice should remain active until
                manually removed.
              </span>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="secondary-button"
                onClick={resetForm}
                disabled={saving}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="primary-button"
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingNotice
                    ? "Update Notice"
                    : "Publish Notice"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="portal-card">
        <div className="card-heading-row">
          <div>
            <h2>School Notices</h2>

            <p>
              {notices.length} notice
              {notices.length === 1 ? "" : "s"} found
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

        {loading ? (
          <div className="empty-state">
            Loading notices...
          </div>
        ) : notices.length === 0 ? (
          <div className="empty-state">
            <Bell size={38} />

            <h3>No notices yet</h3>

            <p>
              Create your first school-wide announcement.
            </p>
          </div>
        ) : (
          <div className="admin-notices-list">
            {notices.map((notice) => (
              <article
                key={notice.id}
                className={`admin-notice-card ${
                  notice.isActive ? "" : "inactive"
                }`}
              >
                <div className="admin-notice-card-main">
                  <div className="admin-notice-icon">
                    <Bell size={20} />
                  </div>

                  <div className="admin-notice-content">
                    <div className="admin-notice-title-row">
                      <h3>{notice.title}</h3>

                      <span
                        className={
                          notice.isActive
                            ? "notice-status active"
                            : "notice-status inactive"
                        }
                      >
                        {notice.isActive
                          ? "Active"
                          : "Inactive"}
                      </span>
                    </div>

                    <p className="admin-notice-message">
                      {notice.message}
                    </p>

                    <div className="admin-notice-meta">
                      <span>
                        <CalendarDays size={15} />
                        Published{" "}
                        {formatDate(notice.createdAt)}
                      </span>

                      <span>
                        <CalendarDays size={15} />
                        {notice.expiresAt
                          ? `Expires ${formatDate(
                              notice.expiresAt
                            )}`
                          : "No expiry"}
                      </span>

                      {notice.createdBy?.name && (
                        <span>
                          By {notice.createdBy.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="admin-notice-actions">
                  <button
                    type="button"
                    className="icon-button"
                    onClick={() => startEdit(notice)}
                    title="Edit notice"
                  >
                    <Edit3 size={18} />
                  </button>

                  {notice.isActive ? (
                    <button
                      type="button"
                      className="icon-button danger"
                      onClick={() =>
                        deactivateNotice(notice)
                      }
                      title="Remove notice"
                    >
                      <Trash2 size={18} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        reactivateNotice(notice)
                      }
                    >
                      Activate
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}