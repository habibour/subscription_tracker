import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Layout.css";

const Layout = ({ children }) => {
  const { user, signOut } = useAuth();

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-brand">
            <span className="brand-icon">⬡</span>
            <span className="brand-text">Subscriptions</span>
          </Link>

          <div className="navbar-menu">
            <Link to="/" className="nav-link">
              Home
            </Link>
            <Link to="/dashboard" className="nav-link">
              Dashboard
            </Link>
            <Link to="/add" className="nav-link">
              Add New
            </Link>
          </div>

          <div className="navbar-user">
            <span className="user-greeting">Hi, {user?.username}</span>
            <button onClick={signOut} className="btn-signout">
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">{children}</main>

      <footer className="footer">
        <p>© 2026 Subscription Tracker. Designed with simplicity in mind.</p>
      </footer>
    </div>
  );
};

export default Layout;
