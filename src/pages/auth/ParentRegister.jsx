import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ParentRegister() {
  const { registerParent } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!form.email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await registerParent(
        form.name.trim(),
        form.email.trim(),
        form.password,
        form.phone.trim()
      );

      navigate("/parent/children", {
        replace: true,
      });
    } catch (err) {
      setError(
        err.message ||
          "Unable to create parent account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Parent Registration</h1>

          <p>
            Create your parent or guardian account
            to register and manage your children.
          </p>
        </div>

        {error && (
          <div className="auth-error">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="auth-form"
        >
          <div className="form-group">
            <label htmlFor="name">
              Parent / Guardian Name
            </label>

            <input
              id="name"
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter your full name"
              autoComplete="name"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">
              Email Address
            </label>

            <input
              id="email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="Enter your email"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="phone">
              Phone Number
            </label>

            <input
              id="phone"
              type="text"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
              autoComplete="tel"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              Password
            </label>

            <input
              id="password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">
              Confirm Password
            </label>

            <input
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              autoComplete="new-password"
              required
            />
          </div>

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Create Parent Account"}
          </button>
        </form>

        <div className="auth-footer">
          <span>
            Already have an account?
          </span>

          <Link to="/login">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}