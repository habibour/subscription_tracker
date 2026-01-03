import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { subscriptionsAPI } from "../api/subscriptions";
import SubscriptionCard from "../components/SubscriptionCard";
import "./Dashboard.css";

const Dashboard = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchSubscriptions();
  }, [user]);

  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      const response = await subscriptionsAPI.getAll(user.id);
      setSubscriptions(response.data || []);
    } catch (err) {
      setError("Failed to load subscriptions");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await subscriptionsAPI.delete(id);
      setSubscriptions(subscriptions.filter((sub) => sub._id !== id));
    } catch (err) {
      console.error("Failed to delete subscription:", err);
    }
  };

  // Calculate stats
  const monthlyTotal = subscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => {
      if (s.frequency === "monthly") return sum + s.price;
      if (s.frequency === "yearly") return sum + s.price / 12;
      return sum;
    }, 0);

  const yearlyTotal = monthlyTotal * 12;
  const activeCount = subscriptions.filter((s) => s.status === "active").length;

  const getCategoryColor = (category) => {
    const colors = {
      entertainment: "var(--color-entertainment)",
      productivity: "var(--color-productivity)",
      education: "var(--color-education)",
      health: "var(--color-health)",
      other: "var(--color-other)",
    };
    return colors[category] || colors.other;
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner" />
      </div>
    );
  }

  return (
    <div className="dashboard animate-fade-in">
      <header className="dashboard-header">
        <div>
          <h1>Your Subscriptions</h1>
          <p>Manage and track all your recurring payments</p>
        </div>
        <Link to="/add" className="btn btn-primary">
          <span>+</span> Add Subscription
        </Link>
      </header>

      {error && <div className="dashboard-error">{error}</div>}

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <span className="stat-label">Monthly Spending</span>
          <span className="stat-value">${monthlyTotal.toFixed(2)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Yearly Spending</span>
          <span className="stat-value">${yearlyTotal.toFixed(2)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-label">Active Subscriptions</span>
          <span className="stat-value">{activeCount}</span>
        </div>
      </div>

      {/* Subscriptions List */}
      {subscriptions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">◇</div>
          <h2>No subscriptions yet</h2>
          <p>Start tracking your first subscription to see it here.</p>
          <Link to="/add" className="btn btn-primary">
            Add Your First Subscription
          </Link>
        </div>
      ) : (
        <div className="subscriptions-grid">
          {subscriptions.map((subscription) => (
            <SubscriptionCard
              key={subscription._id}
              subscription={subscription}
              categoryColor={getCategoryColor(subscription.catagory)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
