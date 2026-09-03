import {
  GraduationCap,
  LogIn,
  Menu,
  X,
} from "lucide-react";

import { useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
} from "react-router-dom";

export default function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navigation = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Classes", path: "/classes" },
    { name: "Teachers", path: "/teachers" },
    { name: "News", path: "/news" },
    { name: "Apply", path: "/apply" },
  ];

  return (
    <div className="site">
      <header className="public-header">
        <div className="container nav-container">
          <Link to="/" className="brand">
            <div className="brand-icon">
              <GraduationCap size={26} />
            </div>

            <div>
              <strong>KTN Digital School</strong>
              <span>Learn • Grow • Succeed</span>
            </div>
          </Link>

          <nav className="desktop-nav">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  isActive ? "nav-active" : ""
                }
              >
                {item.name}
              </NavLink>
            ))}

            <Link to="/login" className="login-button">
              <LogIn size={18} />
              Login
            </Link>
          </nav>

          <button
            className="mobile-menu-button"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X /> : <Menu />}
          </button>
        </div>

        {mobileOpen && (
          <nav className="mobile-nav">
            {navigation.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
              >
                {item.name}
              </NavLink>
            ))}

            <Link
              to="/login"
              onClick={() => setMobileOpen(false)}
            >
              Login
            </Link>
          </nav>
        )}
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container footer-content">
          <div>
            <strong>KTN Digital School</strong>
            <p>Empowering students through digital learning.</p>
          </div>

          <p>
            © {new Date().getFullYear()} KTN Digital School
          </p>
        </div>
      </footer>
    </div>
  );
}