import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Landing.css";

const Landing = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="landing">
      <nav className="landing-nav">
        <div className="landing-nav-container">
          <Link to="/" className="landing-brand">
            <span className="brand-icon">⬡</span>
            <span>Subscriptions</span>
          </Link>
          <div className="landing-nav-links">
            {isAuthenticated ? (
              <Link to="/dashboard" className="btn btn-primary">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn btn-ghost">
                  Sign In
                </Link>
                <Link to="/signup" className="btn btn-primary">
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero-content animate-slide-up">
          <h1 className="hero-title">
            Track your subscriptions.
            <br />
            <span className="text-gradient">Beautifully.</span>
          </h1>
          <p className="hero-subtitle">
            One place to manage all your recurring payments. Get reminders
            before you're charged. Stay in control.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn btn-primary btn-large">
              Start Free
            </Link>
            <Link to="/login" className="btn btn-secondary btn-large">
              Sign In
            </Link>
          </div>
        </div>

        <div className="hero-visual animate-fade-in">
          <div className="hero-card">
            <div className="hero-card-header">
              <div className="hero-card-icon entertainment">◈</div>
              <div>
                <h3>Netflix</h3>
                <span>Entertainment</span>
              </div>
              <div className="hero-card-price">$15.99/mo</div>
            </div>
          </div>
          <div className="hero-card">
            <div className="hero-card-header">
              <div className="hero-card-icon productivity">◇</div>
              <div>
                <h3>Spotify</h3>
                <span>Entertainment</span>
              </div>
              <div className="hero-card-price">$9.99/mo</div>
            </div>
          </div>
          <div className="hero-card">
            <div className="hero-card-header">
              <div className="hero-card-icon education">○</div>
              <div>
                <h3>iCloud+</h3>
                <span>Productivity</span>
              </div>
              <div className="hero-card-price">$2.99/mo</div>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="features-container">
          <div className="feature animate-slide-up">
            <div className="feature-icon">⬢</div>
            <h3>Dashboard Overview</h3>
            <p>
              See all your subscriptions at a glance with beautiful analytics
              and spending insights.
            </p>
          </div>
          <div
            className="feature animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="feature-icon">◎</div>
            <h3>Smart Reminders</h3>
            <p>
              Get notified before renewal dates so you never get charged
              unexpectedly.
            </p>
          </div>
          <div
            className="feature animate-slide-up"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="feature-icon">▣</div>
            <h3>Simple & Clean</h3>
            <p>
              A minimal interface designed to help you focus on what matters
              most.
            </p>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <p>© 2026 Subscription Tracker. Built with ❤️</p>
      </footer>
    </div>
  );
};

export default Landing;
