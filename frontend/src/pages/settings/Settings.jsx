import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

export default function Settings() {
  const { user, logout } = useAuth();

  const [activeTab, setActiveTab] =
    useState("profile");

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [school, setSchool] = useState({
    schoolName: "",
    shortName: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    administratorName: "",
    logoUrl: "",
    timezone: "Asia/Seoul",
    language: "en",
    admissionOpen: true,
  });

  const [passwordForm, setPasswordForm] =
    useState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });

  const [deletePassword, setDeletePassword] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [error, setError] =
    useState("");

  const isAdmin =
    user?.role === "ADMIN";

  const isParent =
    user?.role === "PARENT";

  /* ========================================
     LOAD SETTINGS
  ======================================== */

  useEffect(() => {
    async function loadSettings() {
      setLoading(true);
      setError("");

      try {
        const profileResponse =
          await fetch(
            `${API_URL}/api/settings/profile`,
            {
              credentials: "include",
            }
          );

        const profileData =
          await profileResponse.json();

        if (!profileResponse.ok) {
          throw new Error(
            profileData.message ||
              "Unable to load profile"
          );
        }

        setProfile({
          name:
            profileData.profile?.name ||
            "",

          email:
            profileData.profile?.email ||
            "",

          phone:
            profileData.profile?.phone ||
            "",
        });

        if (isAdmin) {
          const schoolResponse =
            await fetch(
              `${API_URL}/api/settings/school`,
              {
                credentials: "include",
              }
            );

          const schoolData =
            await schoolResponse.json();

          if (!schoolResponse.ok) {
            throw new Error(
              schoolData.message ||
                "Unable to load school settings"
            );
          }

          setSchool({
            schoolName:
              schoolData.settings
                ?.schoolName || "",

            shortName:
              schoolData.settings
                ?.shortName || "",

            address:
              schoolData.settings
                ?.address || "",

            phone:
              schoolData.settings
                ?.phone || "",

            email:
              schoolData.settings
                ?.email || "",

            website:
              schoolData.settings
                ?.website || "",

            administratorName:
              schoolData.settings
                ?.administratorName || "",

            logoUrl:
              schoolData.settings
                ?.logoUrl || "",

            timezone:
              schoolData.settings
                ?.timezone ||
              "Asia/Seoul",

            language:
              schoolData.settings
                ?.language ||
              "en",

            admissionOpen:
              schoolData.settings
                ?.admissionOpen ??
              true,
          });
        }
      } catch (err) {
        setError(
          err.message ||
            "Unable to load settings"
        );
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      loadSettings();
    }
  }, [user, isAdmin]);

  /* ========================================
     PROFILE UPDATE
  ======================================== */

  async function handleProfileSubmit(
    event
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/settings/profile`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            name: profile.name,

            phone: isParent
              ? profile.phone
              : null,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update profile"
        );
      }

      setMessage(
        "Profile updated successfully."
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to update profile"
      );
    } finally {
      setSaving(false);
    }
  }

  /* ========================================
     SCHOOL SETTINGS UPDATE
  ======================================== */

  async function handleSchoolSubmit(
    event
  ) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(
        `${API_URL}/api/settings/school`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify(school),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to update school settings"
        );
      }

      setSchool({
        schoolName:
          data.settings.schoolName ||
          "",

        shortName:
          data.settings.shortName ||
          "",

        address:
          data.settings.address ||
          "",

        phone:
          data.settings.phone ||
          "",

        email:
          data.settings.email ||
          "",

        website:
          data.settings.website ||
          "",

        administratorName:
          data.settings
            .administratorName ||
          "",

        logoUrl:
          data.settings.logoUrl ||
          "",

        timezone:
          data.settings.timezone ||
          "Asia/Seoul",

        language:
          data.settings.language ||
          "en",

        admissionOpen:
          data.settings.admissionOpen,
      });

      setMessage(
        "School settings updated successfully."
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to update school settings"
      );
    } finally {
      setSaving(false);
    }
  }

  /* ========================================
     PASSWORD CHANGE
  ======================================== */

  async function handlePasswordSubmit(
    event
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (
      passwordForm.newPassword !==
      passwordForm.confirmPassword
    ) {
      setError(
        "New passwords do not match."
      );

      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/api/settings/password`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            currentPassword:
              passwordForm.currentPassword,

            newPassword:
              passwordForm.newPassword,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to change password"
        );
      }

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setMessage(
        "Password changed successfully."
      );
    } catch (err) {
      setError(
        err.message ||
          "Unable to change password"
      );
    } finally {
      setSaving(false);
    }
  }

  /* ========================================
     PARENT ACCOUNT DEACTIVATION
  ======================================== */

  async function handleDeleteAccount() {
    setMessage("");
    setError("");

    if (!deletePassword) {
      setError(
        "Please enter your password."
      );

      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to deactivate your account? You will no longer be able to sign in."
      );

    if (!confirmed) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/api/settings/account`,
        {
          method: "DELETE",

          headers: {
            "Content-Type":
              "application/json",
          },

          credentials: "include",

          body: JSON.stringify({
            password:
              deletePassword,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Unable to deactivate account"
        );
      }

      setDeletePassword("");

      await logout();
    } catch (err) {
      setError(
        err.message ||
          "Unable to deactivate account"
      );
    } finally {
      setSaving(false);
    }
  }

  /* ========================================
     TAB CHANGE
  ======================================== */

  function changeTab(tab) {
    setActiveTab(tab);
    setMessage("");
    setError("");
  }

  if (loading) {
    return (
      <div style={styles.loading}>
        Loading settings...
      </div>
    );
  }

  return (
    <div style={styles.page}>
      {/* HEADER */}

      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            Settings
          </h1>

          <p style={styles.subtitle}>
            Manage your account
            {isAdmin
              ? " and school settings."
              : "."}
          </p>
        </div>
      </div>

      <div style={styles.layout}>
        {/* SETTINGS NAVIGATION */}

        <div style={styles.sidebar}>
          {isAdmin && (
            <button
              type="button"
              style={
                activeTab ===
                "school"
                  ? styles.activeTab
                  : styles.tab
              }
              onClick={() =>
                changeTab(
                  "school"
                )
              }
            >
              School Settings
            </button>
          )}

          <button
            type="button"
            style={
              activeTab ===
              "profile"
                ? styles.activeTab
                : styles.tab
            }
            onClick={() =>
              changeTab(
                "profile"
              )
            }
          >
            Profile
          </button>

          <button
            type="button"
            style={
              activeTab ===
              "security"
                ? styles.activeTab
                : styles.tab
            }
            onClick={() =>
              changeTab(
                "security"
              )
            }
          >
            Security
          </button>

          <button
            type="button"
            style={
              activeTab ===
              "privacy"
                ? styles.activeTab
                : styles.tab
            }
            onClick={() =>
              changeTab(
                "privacy"
              )
            }
          >
            Privacy & Data
          </button>
        </div>

        {/* CONTENT */}

        <div style={styles.content}>
          {message && (
            <div style={styles.success}>
              {message}
            </div>
          )}

          {error && (
            <div style={styles.error}>
              {error}
            </div>
          )}

          {/* =====================================
              SCHOOL SETTINGS
          ===================================== */}

          {activeTab ===
            "school" &&
            isAdmin && (
              <form
                onSubmit={
                  handleSchoolSubmit
                }
              >
                <h2
                  style={
                    styles.sectionTitle
                  }
                >
                  School Settings
                </h2>

                <p
                  style={
                    styles.description
                  }
                >
                  Manage the general
                  information for KTN
                  Digital School.
                </p>

                <div
                  style={
                    styles.grid
                  }
                >
                  <Field
                    label="School Name"
                    value={
                      school.schoolName
                    }
                    required
                    onChange={(
                      value
                    ) =>
                      setSchool({
                        ...school,
                        schoolName:
                          value,
                      })
                    }
                  />

                  <Field
                    label="Short Name"
                    value={
                      school.shortName
                    }
                    onChange={(
                      value
                    ) =>
                      setSchool({
                        ...school,
                        shortName:
                          value,
                      })
                    }
                  />

                  <Field
                    label="Administrator Name"
                    value={
                      school.administratorName
                    }
                    onChange={(
                      value
                    ) =>
                      setSchool({
                        ...school,
                        administratorName:
                          value,
                      })
                    }
                  />

                  <Field
                    label="School Email"
                    type="email"
                    value={
                      school.email
                    }
                    onChange={(
                      value
                    ) =>
                      setSchool({
                        ...school,
                        email:
                          value,
                      })
                    }
                  />

                  <Field
                    label="Phone"
                    value={
                      school.phone
                    }
                    onChange={(
                      value
                    ) =>
                      setSchool({
                        ...school,
                        phone:
                          value,
                      })
                    }
                  />

                  <Field
                    label="Website"
                    value={
                      school.website
                    }
                    placeholder="https://..."
                    onChange={(
                      value
                    ) =>
                      setSchool({
                        ...school,
                        website:
                          value,
                      })
                    }
                  />

                  <Field
                    label="Timezone"
                    value={
                      school.timezone
                    }
                    required
                    onChange={(
                      value
                    ) =>
                      setSchool({
                        ...school,
                        timezone:
                          value,
                      })
                    }
                  />

                  <div
                    style={
                      styles.field
                    }
                  >
                    <label
                      style={
                        styles.label
                      }
                    >
                      Language
                    </label>

                    <select
                      value={
                        school.language
                      }
                      style={
                        styles.input
                      }
                      onChange={(
                        event
                      ) =>
                        setSchool({
                          ...school,

                          language:
                            event
                              .target
                              .value,
                        })
                      }
                    >
                      <option value="en">
                        English
                      </option>

                      <option value="ko">
                        Korean
                      </option>

                      <option value="ta">
                        Tamil
                      </option>
                    </select>
                  </div>
                </div>

                <div
                  style={
                    styles.field
                  }
                >
                  <label
                    style={
                      styles.label
                    }
                  >
                    Address
                  </label>

                  <textarea
                    value={
                      school.address
                    }
                    style={
                      styles.textarea
                    }
                    onChange={(
                      event
                    ) =>
                      setSchool({
                        ...school,

                        address:
                          event
                            .target
                            .value,
                      })
                    }
                  />
                </div>

                <div
                  style={
                    styles.switchRow
                  }
                >
                  <div>
                    <strong>
                      Admissions
                    </strong>

                    <div
                      style={
                        styles.smallText
                      }
                    >
                      Control whether
                      new admission
                      applications are
                      accepted.
                    </div>
                  </div>

                  <label
                    style={
                      styles.switchLabel
                    }
                  >
                    <input
                      type="checkbox"
                      checked={
                        school.admissionOpen
                      }
                      onChange={(
                        event
                      ) =>
                        setSchool({
                          ...school,

                          admissionOpen:
                            event
                              .target
                              .checked,
                        })
                      }
                    />

                    {school.admissionOpen
                      ? " Open"
                      : " Closed"}
                  </label>
                </div>

                <button
                  type="submit"
                  style={
                    styles.primaryButton
                  }
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Saving..."
                    : "Save School Settings"}
                </button>
              </form>
            )}

          {/* =====================================
              PROFILE
          ===================================== */}

          {activeTab ===
            "profile" && (
              <form
                onSubmit={
                  handleProfileSubmit
                }
              >
                <h2
                  style={
                    styles.sectionTitle
                  }
                >
                  Profile
                </h2>

                <p
                  style={
                    styles.description
                  }
                >
                  Manage your personal
                  account information.
                </p>

                <div
                  style={
                    styles.grid
                  }
                >
                  <Field
                    label="Name"
                    value={
                      profile.name
                    }
                    required
                    onChange={(
                      value
                    ) =>
                      setProfile({
                        ...profile,
                        name:
                          value,
                      })
                    }
                  />

                  <Field
                    label="Email"
                    type="email"
                    value={
                      profile.email
                    }
                    disabled
                    onChange={() => {}}
                  />

                  {isParent && (
                    <Field
                      label="Phone"
                      value={
                        profile.phone
                      }
                      onChange={(
                        value
                      ) =>
                        setProfile({
                          ...profile,

                          phone:
                            value,
                        })
                      }
                    />
                  )}
                </div>

                <button
                  type="submit"
                  style={
                    styles.primaryButton
                  }
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Saving..."
                    : "Save Profile"}
                </button>
              </form>
            )}

          {/* =====================================
              SECURITY
          ===================================== */}

          {activeTab ===
            "security" && (
              <form
                onSubmit={
                  handlePasswordSubmit
                }
              >
                <h2
                  style={
                    styles.sectionTitle
                  }
                >
                  Security
                </h2>

                <p
                  style={
                    styles.description
                  }
                >
                  Change your account
                  password.
                </p>

                <div
                  style={
                    styles.passwordArea
                  }
                >
                  <Field
                    label="Current Password"
                    type="password"
                    value={
                      passwordForm
                        .currentPassword
                    }
                    required
                    onChange={(
                      value
                    ) =>
                      setPasswordForm({
                        ...passwordForm,

                        currentPassword:
                          value,
                      })
                    }
                  />

                  <Field
                    label="New Password"
                    type="password"
                    value={
                      passwordForm
                        .newPassword
                    }
                    required
                    onChange={(
                      value
                    ) =>
                      setPasswordForm({
                        ...passwordForm,

                        newPassword:
                          value,
                      })
                    }
                  />

                  <Field
                    label="Confirm New Password"
                    type="password"
                    value={
                      passwordForm
                        .confirmPassword
                    }
                    required
                    onChange={(
                      value
                    ) =>
                      setPasswordForm({
                        ...passwordForm,

                        confirmPassword:
                          value,
                      })
                    }
                  />
                </div>

                <button
                  type="submit"
                  style={
                    styles.primaryButton
                  }
                  disabled={
                    saving
                  }
                >
                  {saving
                    ? "Updating..."
                    : "Change Password"}
                </button>
              </form>
            )}

          {/* =====================================
              PRIVACY
          ===================================== */}

          {activeTab ===
            "privacy" && (
              <div>
                <h2
                  style={
                    styles.sectionTitle
                  }
                >
                  Privacy & Data
                </h2>

                <p
                  style={
                    styles.description
                  }
                >
                  Review your account
                  information, privacy,
                  and how school records
                  are managed.
                </p>

                {/* ACCOUNT INFORMATION */}

                <div
                  style={
                    styles.infoBox
                  }
                >
                  <h3
                    style={
                      styles.infoTitle
                    }
                  >
                    Account Information
                  </h3>

                  <div
                    style={
                      styles.privacyRow
                    }
                  >
                    <span
                      style={
                        styles.privacyLabel
                      }
                    >
                      Name
                    </span>

                    <strong>
                      {profile.name ||
                        "-"}
                    </strong>
                  </div>

                  <div
                    style={
                      styles.privacyRow
                    }
                  >
                    <span
                      style={
                        styles.privacyLabel
                      }
                    >
                      Email
                    </span>

                    <strong>
                      {profile.email ||
                        "-"}
                    </strong>
                  </div>

                  <div
                    style={
                      styles.privacyRow
                    }
                  >
                    <span
                      style={
                        styles.privacyLabel
                      }
                    >
                      Account Type
                    </span>

                    <strong>
                      {user?.role ||
                        "-"}
                    </strong>
                  </div>

                  {isParent && (
                    <div
                      style={
                        styles.privacyRow
                      }
                    >
                      <span
                        style={
                          styles.privacyLabel
                        }
                      >
                        Phone
                      </span>

                      <strong>
                        {profile.phone ||
                          "Not provided"}
                      </strong>
                    </div>
                  )}
                </div>

                {/* DATA PRIVACY */}

                <div
                  style={
                    styles.infoBox
                  }
                >
                  <h3
                    style={
                      styles.infoTitle
                    }
                  >
                    Data Privacy
                  </h3>

                  <p
                    style={
                      styles.infoText
                    }
                  >
                    KTN Digital School
                    uses account
                    information to
                    provide access to
                    the school portal
                    and services
                    available for your
                    assigned role.
                  </p>

                  <p
                    style={{
                      ...styles.infoText,
                      marginTop:
                        "10px",
                    }}
                  >
                    Access to school
                    information is
                    restricted according
                    to whether the
                    account belongs to
                    an administrator,
                    teacher, or parent.
                  </p>
                </div>

                {/* SCHOOL RECORDS */}

                <div
                  style={
                    styles.infoBox
                  }
                >
                  <h3
                    style={
                      styles.infoTitle
                    }
                  >
                    School Records
                  </h3>

                  <p
                    style={
                      styles.infoText
                    }
                  >
                    Student admission,
                    enrollment,
                    attendance,
                    homework and
                    examination
                    information are
                    maintained
                    separately from
                    the parent login
                    account.
                  </p>

                  {isParent && (
                    <p
                      style={{
                        ...styles.infoText,

                        marginTop:
                          "10px",
                      }}
                    >
                      Deactivating your
                      parent account
                      does not
                      automatically
                      remove your
                      child's official
                      school records.
                    </p>
                  )}
                </div>

                {/* SECURITY */}

                <div
                  style={
                    styles.infoBox
                  }
                >
                  <h3
                    style={
                      styles.infoTitle
                    }
                  >
                    Account Security
                  </h3>

                  <p
                    style={
                      styles.infoText
                    }
                  >
                    Your password is
                    used to protect
                    access to your KTN
                    Digital School
                    account. You can
                    change your
                    password from the
                    Security section of
                    Settings.
                  </p>

                  <button
                    type="button"
                    style={
                      styles.secondaryButton
                    }
                    onClick={() =>
                      changeTab(
                        "security"
                      )
                    }
                  >
                    Go to Security
                  </button>
                </div>

                {/* PARENT ACCOUNT */}

                {isParent && (
                  <div
                    style={
                      styles.dangerZone
                    }
                  >
                    <h3
                      style={
                        styles.dangerTitle
                      }
                    >
                      Deactivate Account
                    </h3>

                    <p
                      style={
                        styles.dangerText
                      }
                    >
                      This action
                      disables your
                      parent login
                      account. You will
                      no longer be able
                      to sign in using
                      this account.
                    </p>

                    <div
                      style={
                        styles.warningBox
                      }
                    >
                      <strong>
                        Your child's
                        school records
                        will not be
                        deleted.
                      </strong>

                      <p
                        style={
                          styles.warningText
                        }
                      >
                        Admission
                        history,
                        enrollment,
                        attendance,
                        homework and
                        exam results
                        remain part of
                        the school's
                        records.
                      </p>
                    </div>

                    <label
                      style={
                        styles.label
                      }
                    >
                      Confirm your
                      password
                    </label>

                    <div
                      style={
                        styles.deleteArea
                      }
                    >
                      <input
                        type="password"
                        value={
                          deletePassword
                        }
                        placeholder="Enter your current password"
                        autoComplete="current-password"
                        style={
                          styles.input
                        }
                        onChange={(
                          event
                        ) =>
                          setDeletePassword(
                            event
                              .target
                              .value
                          )
                        }
                      />

                      <button
                        type="button"
                        style={
                          styles.dangerButton
                        }
                        disabled={
                          saving
                        }
                        onClick={
                          handleDeleteAccount
                        }
                      >
                        {saving
                          ? "Deactivating..."
                          : "Deactivate My Account"}
                      </button>
                    </div>
                  </div>
                )}

                {/* ADMIN / TEACHER */}

                {!isParent && (
                  <div
                    style={
                      styles.infoBox
                    }
                  >
                    <h3
                      style={
                        styles.infoTitle
                      }
                    >
                      Account Management
                    </h3>

                    <p
                      style={
                        styles.infoText
                      }
                    >
                      Administrator and
                      teacher accounts
                      are managed as
                      school staff
                      accounts.
                      Account
                      deactivation
                      should be handled
                      through the
                      school's
                      administrative
                      process.
                    </p>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}

/* ========================================
   FIELD COMPONENT
======================================== */

function Field({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  disabled = false,
  placeholder = "",
}) {
  return (
    <div style={styles.field}>
      <label style={styles.label}>
        {label}
      </label>

      <input
        type={type}
        value={value}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        style={{
          ...styles.input,

          ...(disabled
            ? styles.disabledInput
            : {}),
        }}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      />
    </div>
  );
}

/* ========================================
   STYLES
======================================== */

const styles = {
  page: {
    width: "100%",
    maxWidth: "1200px",
    margin: "0 auto",
  },

  header: {
    marginBottom: "24px",
  },

  title: {
    margin: 0,
    fontSize: "30px",
    fontWeight: 700,
  },

  subtitle: {
    marginTop: "7px",
    color: "#64748b",
  },

  layout: {
    display: "grid",
    gridTemplateColumns:
      "220px minmax(0, 1fr)",
    gap: "24px",
    alignItems: "start",
  },

  sidebar: {
    background: "#ffffff",
    border:
      "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "10px",
    display: "flex",
    flexDirection: "column",
    gap: "5px",
  },

  tab: {
    width: "100%",
    border: "none",
    background: "transparent",
    padding: "11px 12px",
    textAlign: "left",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
  },

  activeTab: {
    width: "100%",
    border: "none",
    background: "#eef2ff",
    padding: "11px 12px",
    textAlign: "left",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: 600,
  },

  content: {
    background: "#ffffff",
    border:
      "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "28px",
  },

  sectionTitle: {
    margin: "0 0 5px",
    fontSize: "22px",
  },

  description: {
    color: "#64748b",
    marginTop: 0,
    marginBottom: "25px",
  },

  grid: {
    display: "grid",

    gridTemplateColumns:
      "repeat(auto-fit, minmax(240px, 1fr))",

    gap: "18px",
    marginBottom: "18px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
    marginBottom: "18px",
  },

  label: {
    fontSize: "14px",
    fontWeight: 600,
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px 12px",
    border:
      "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "14px",
  },

  disabledInput: {
    background: "#f8fafc",
    color: "#64748b",
  },

  textarea: {
    width: "100%",
    minHeight: "90px",
    boxSizing: "border-box",
    padding: "11px 12px",
    border:
      "1px solid #cbd5e1",
    borderRadius: "8px",
    resize: "vertical",
  },

  primaryButton: {
    border: "none",
    borderRadius: "8px",
    padding: "11px 18px",
    background: "#1e40af",
    color: "#ffffff",
    fontWeight: 600,
    cursor: "pointer",
  },

  secondaryButton: {
    marginTop: "15px",
    border:
      "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "9px 14px",
    background: "#ffffff",
    fontWeight: 600,
    cursor: "pointer",
  },

  switchRow: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "20px",
    border:
      "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "16px",
    marginBottom: "22px",
  },

  switchLabel: {
    whiteSpace: "nowrap",
    fontWeight: 600,
  },

  smallText: {
    color: "#64748b",
    fontSize: "13px",
    marginTop: "4px",
  },

  passwordArea: {
    maxWidth: "500px",
  },

  success: {
    background: "#ecfdf5",
    border:
      "1px solid #a7f3d0",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "20px",
  },

  error: {
    background: "#fef2f2",
    border:
      "1px solid #fecaca",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "20px",
  },

  infoBox: {
    border:
      "1px solid #e5e7eb",
    borderRadius: "10px",
    padding: "18px",
    marginBottom: "15px",
  },

  infoTitle: {
    margin: "0 0 8px",
    fontSize: "16px",
  },

  infoText: {
    margin: 0,
    color: "#64748b",
    lineHeight: 1.6,
  },

  privacyRow: {
    display: "flex",
    justifyContent:
      "space-between",
    alignItems: "center",
    gap: "20px",
    padding: "11px 0",
    borderBottom:
      "1px solid #f1f5f9",
  },

  privacyLabel: {
    color: "#64748b",
    fontSize: "14px",
  },

  dangerZone: {
    border:
      "1px solid #fecaca",
    background: "#fffafa",
    borderRadius: "10px",
    padding: "20px",
    marginTop: "28px",
  },

  dangerTitle: {
    margin: "0 0 8px",
    color: "#b91c1c",
  },

  dangerText: {
    color: "#64748b",
    lineHeight: 1.6,
  },

  warningBox: {
    background: "#fff7ed",
    border:
      "1px solid #fed7aa",
    borderRadius: "8px",
    padding: "13px",
    marginTop: "15px",
    marginBottom: "18px",
  },

  warningText: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  deleteArea: {
    maxWidth: "450px",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    marginTop: "18px",
  },

  dangerButton: {
    alignSelf:
      "flex-start",
    border: "none",
    borderRadius: "8px",
    padding: "11px 18px",
    background: "#b91c1c",
    color: "#ffffff",
    fontWeight: 600,
    cursor: "pointer",
  },

  loading: {
    padding: "30px",
  },
};