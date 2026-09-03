import {
  ArrowLeft,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  Mail,
} from "lucide-react";

import { useState } from "react";

import {
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "../../context/AuthContext";

export default function Login() {
  const { login } = useAuth();

  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSubmitting(true);

    try {
      const user = await login(
        email,
        password
      );

      switch (user.role) {
  case "ADMIN":
    navigate("/admin/dashboard");
    break;

  case "TEACHER":
    navigate("/teacher/dashboard");
    break;

  case "PARENT":
    navigate("/parent/dashboard");
    break;

  default:
    navigate("/unauthorized");
}
    } catch (err) {
      setError(
        err.message ||
          "Unable to sign in"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <Link
        to="/"
        className="back-home"
      >
        <ArrowLeft size={18} />
        Back to school website
      </Link>

      <div className="login-container">
        <div className="login-brand">
          <div className="login-logo">
            <GraduationCap
              size={38}
            />
          </div>

          <h1>Welcome back</h1>

          <p>
            Sign in to KTN Digital
            School
          </p>
        </div>

        <form
          className="login-card"
          onSubmit={handleSubmit}
        >
          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          <label>
            Email address

            <div className="input-wrapper">
              <Mail size={19} />

              <input
                type="email"
                value={email}
                required
                placeholder="your@email.com"
                autoComplete="email"
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
              />
            </div>
          </label>

          <label>
            Password

            <div className="input-wrapper">
              <Lock size={19} />

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                required
                placeholder="Enter your password"
                autoComplete="current-password"
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
              />

              <button
                type="button"
                className="show-password"
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
                onClick={() =>
                  setShowPassword(
                    (current) =>
                      !current
                  )
                }
              >
                {showPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </label>

          <button
            type="submit"
            className="primary-button login-submit"
            disabled={submitting}
          >
            {submitting
              ? "Signing in..."
              : "Sign In"}
          </button>

          <div className="parent-register-link">
            <span>
              Parent without an
              account?
            </span>

            <Link to="/register-parent">
              Create Parent Account
            </Link>
          </div>

          <div className="demo-login">
            <strong>
              Development Demo
            </strong>

            <span>
              Admin:
              admin@ktn.school
            </span>

            <span>
              Password: admin123
            </span>
          </div>
        </form>
      </div>
    </div>
  );
}