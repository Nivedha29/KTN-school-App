import {
  CheckCircle2,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import SectionTitle from "./SectionTitle";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "/api";

export default function Apply() {
  const navigate = useNavigate();

  const [admissionOpen, setAdmissionOpen] =
    useState(true);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    loadAdmissionStatus();
  }, []);

  async function loadAdmissionStatus() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/settings/admission-status`,
        {
          credentials: "include",
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to check admission status."
        );
      }

      setAdmissionOpen(
        data.admissionOpen !== false
      );
    } catch (err) {
      console.error(
        "Admission status error:",
        err
      );


      setAdmissionOpen(true);

      setError(
        "We could not confirm the current admission status. You may still create or access your parent account."
      );
    } finally {
      setLoading(false);
    }
  }

  function goToRegister() {
  navigate("/register-parent");
}

  function goToLogin() {
    navigate("/login");
  }

  return (
    <>
      <SectionTitle
        eyebrow="Admissions"
        title="Apply to KTN Digital School"
      />

      <p className="lead">
        KTN Digital School admissions are
        managed through the Parent Portal.
        Parents or guardians first create an
        account, register their child, and
        submit an admission request for
        review.
      </p>

      {error && (
        <div className="error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="card formCard">
          <p>
            Checking admission availability...
          </p>
        </div>
      ) : admissionOpen ? (
        <div className="card formCard">
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: "18px",
            }}
          >
            <CheckCircle2 size={52} />
          </div>

          <h2
            style={{
              textAlign: "center",
              marginBottom: "10px",
            }}
          >
            Admissions are open
          </h2>

          <p
            style={{
              textAlign: "center",
              marginBottom: "24px",
            }}
          >
            To apply for your child, create
            a Parent account or sign in if
            you already have one.
          </p>

          <div className="admission-steps">
            <div>
              <strong>
                1. Create a Parent Account
              </strong>

              <p>
                Register using the parent or
                guardian's details.
              </p>
            </div>

            <div>
              <strong>
                2. Add Your Child
              </strong>

              <p>
                Enter your child's personal
                information and current
                school details.
              </p>
            </div>

            <div>
              <strong>
                3. Submit Admission Request
              </strong>

              <p>
                The application will be sent
                to the KTN admin team for
                review.
              </p>
            </div>

            <div>
              <strong>
                4. KTN Class Assignment
              </strong>

              <p>
                After approval, the admin
                will assign the appropriate
                KTN class.
              </p>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "12px",
              justifyContent: "center",
              flexWrap: "wrap",
              marginTop: "26px",
            }}
          >
            <button
              type="button"
              className="primary"
              onClick={goToRegister}
            >
              <UserPlus size={17} />
              Create Parent Account
            </button>

            <button
              type="button"
              className="secondary"
              onClick={goToLogin}
            >
              <LogIn size={17} />
              Parent Login
            </button>
          </div>

          <p
            className="privacy"
            style={{
              textAlign: "center",
              marginTop: "22px",
            }}
          >
            Students do not need individual
            login accounts. Admission is
            managed by the parent or guardian
            through the Parent Portal.
          </p>
        </div>
      ) : (
        <div className="card formCard">
          <div
            style={{
              textAlign: "center",
            }}
          >
            <h2>
              Admissions are currently closed
            </h2>

            <p
              style={{
                marginTop: "12px",
              }}
            >
              KTN Digital School is not
              currently accepting new
              admission applications.
            </p>

            <p
              style={{
                marginTop: "8px",
              }}
            >
              Existing parents can still
              sign in to access their Parent
              Portal and view their children's
              information.
            </p>

            <button
              type="button"
              className="primary"
              onClick={goToLogin}
              style={{
                marginTop: "20px",
              }}
            >
              <LogIn size={17} />
              Parent Login
            </button>
          </div>
        </div>
      )}
    </>
  );
}