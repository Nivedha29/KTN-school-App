import {
  NavLink,
  Outlet,
  useNavigate,
} from "react-router-dom";

import {
  Bell,
  BookOpen,
  CalendarCheck,
  CalendarDays,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";

import { useState } from "react";

import { useAuth } from "../../context/AuthContext";

export default function PortalLayout() {
  const { user, logout } =
    useAuth();

  const navigate =
    useNavigate();

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  /* ========================================
     TEACHER MENU
  ======================================== */

  const teacherItems = [
    {
      label: "Dashboard",
      path: "dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "My Classes",
      path: "classes",
      icon: BookOpen,
    },
    {
      label: "Attendance",
      path: "attendance",
      icon: CalendarCheck,
    },
    {
      label: "Homework",
      path: "homework",
      icon: FileText,
    },
    {
      label: "Results",
      path: "results",
      icon: GraduationCap,
    },
    {
      label: "Notifications",
      path: "notifications",
      icon: Bell,
    },
    {
      label: "Settings",
      path: "settings",
      icon: Settings,
    },
  ];

  /* ========================================
     PARENT MENU
  ======================================== */

  const parentItems = [
    {
      label: "Dashboard",
      path: "dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "My Children",
      path: "children",
      icon: Users,
    },
    {
      label: "Attendance",
      path: "attendance",
      icon: CalendarCheck,
    },
    {
      label: "Homework",
      path: "homework",
      icon: FileText,
    },
    {
      label: "Results",
      path: "results",
      icon: GraduationCap,
    },
    {
      label: "Notifications",
      path: "notifications",
      icon: Bell,
    },
    {
      label: "Settings",
      path: "settings",
      icon: Settings,
    },
  ];

  /* ========================================
     ADMIN MENU
  ======================================== */

  const adminItems = [
    {
      label: "Dashboard",
      path: "dashboard",
      icon: LayoutDashboard,
    },
    {
      label: "Students",
      path: "students",
      icon: Users,
    },
    {
      label: "Teachers",
      path: "teachers",
      icon: GraduationCap,
    },
    {
      label: "Classes",
      path: "classes",
      icon: BookOpen,
    },
    {
      label: "Timetable",
      path: "timetable",
      icon: CalendarDays,
    },
    {
      label: "Attendance",
      path: "attendance",
      icon: CalendarCheck,
    },
    {
      label: "Notices",
      path: "notices",
      icon: Bell,
    },
    {
      label: "Applications",
      path: "applications",
      icon: FileText,
    },
    {
      label: "Settings",
      path: "settings",
      icon: Settings,
    },
  ];

  function getMenuItems() {
    switch (user?.role) {
      case "ADMIN":
        return adminItems;

      case "TEACHER":
        return teacherItems;

      case "PARENT":
        return parentItems;

      default:
        return [];
    }
  }

  const menuItems =
    getMenuItems();

  async function handleLogout() {
    try {
      await logout();
    } finally {
      navigate(
        "/login",
        {
          replace: true,
        }
      );
    }
  }

  function closeSidebar() {
    setSidebarOpen(false);
  }

  return (
    <div className="portal">
      {/* ==================================
          SIDEBAR
      ================================== */}

      <aside
        className={
          sidebarOpen
            ? "sidebar sidebar-open"
            : "sidebar"
        }
      >
        <div className="sidebar-brand">
          <div className="user-avatar">
            K
          </div>

          <div>
            <strong>
              KTN Digital School
            </strong>

            <span>
              School Portal
            </span>
          </div>

          <button
            type="button"
            className="sidebar-close"
            onClick={
              closeSidebar
            }
            aria-label="Close menu"
          >
            <X size={20} />
          </button>
        </div>

        {/* USER CARD */}

        <div className="user-card">
          <div className="user-avatar">
            {user?.name
              ?.charAt(0)
              ?.toUpperCase() ||
              "U"}
          </div>

          <div>
            <strong>
              {user?.name ||
                "User"}
            </strong>

            <span>
              {formatRole(
                user?.role
              )}
            </span>
          </div>
        </div>

        {/* NAVIGATION */}

        <nav className="sidebar-nav">
          {menuItems.map(
            (item) => {
              const Icon =
                item.icon;

              return (
                <NavLink
                  key={
                    item.path
                  }
                  to={
                    item.path
                  }
                  onClick={
                    closeSidebar
                  }
                  className={({
                    isActive,
                  }) =>
                    isActive
                      ? "sidebar-active"
                      : ""
                  }
                >
                  <Icon
                    size={19}
                  />

                  <span>
                    {
                      item.label
                    }
                  </span>
                </NavLink>
              );
            }
          )}
        </nav>

        {/* LOGOUT */}

        <button
          type="button"
          className="logout-button"
          onClick={
            handleLogout
          }
        >
          <LogOut
            size={19}
          />

          <span>
            Logout
          </span>
        </button>
      </aside>

      {/* ==================================
          MAIN AREA
      ================================== */}

      <div className="portal-main">
        <header className="portal-header">
          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              gap: "12px",
            }}
          >
            <button
              type="button"
              className="portal-menu-button"
              onClick={() =>
                setSidebarOpen(
                  true
                )
              }
              aria-label="Open menu"
            >
              <Menu
                size={22}
              />
            </button>

            <div className="portal-title">
              {getPortalTitle(
                user?.role
              )}
            </div>
          </div>

          <div className="portal-header-actions">
            <div className="header-avatar">
              {user?.name
                ?.charAt(0)
                ?.toUpperCase() ||
                "U"}
            </div>
          </div>
        </header>

        <main className="portal-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function formatRole(role) {
  switch (role) {
    case "ADMIN":
      return "Administrator";

    case "TEACHER":
      return "Teacher";

    case "PARENT":
      return "Parent";

    default:
      return "";
  }
}

function getPortalTitle(role) {
  switch (role) {
    case "ADMIN":
      return "Administration";

    case "TEACHER":
      return "Teacher Portal";

    case "PARENT":
      return "Parent Portal";

    default:
      return "KTN Portal";
  }
}