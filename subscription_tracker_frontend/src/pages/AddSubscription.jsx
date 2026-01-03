import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { subscriptionsAPI } from "../api/subscriptions";
import "./AddSubscription.css";

const AddSubscription = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    currency: "USD",
    frequency: "monthly",
    catagory: "other",
    payementMethod: "credit_card",
    startDate: new Date().toISOString().split("T")[0],
    renewalDate: "",
    status: "active",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Calculate renewal date if not provided
      let renewalDate = formData.renewalDate;
      if (!renewalDate) {
        const start = new Date(formData.startDate);
        if (formData.frequency === "monthly") {
          start.setMonth(start.getMonth() + 1);
        } else {
          start.setFullYear(start.getFullYear() + 1);
        }
        renewalDate = start.toISOString().split("T")[0];
      }

      await subscriptionsAPI.create({
        ...formData,
        price: parseFloat(formData.price),
        renewalDate,
      });

      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create subscription");
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: "entertainment", label: "Entertainment", icon: "▶" },
    { value: "productivity", label: "Productivity", icon: "⚡" },
    { value: "education", label: "Education", icon: "📚" },
    { value: "health", label: "Health", icon: "❤️" },
    { value: "other", label: "Other", icon: "◉" },
  ];

  const paymentMethods = [
    { value: "credit_card", label: "Credit Card" },
    { value: "debit_card", label: "Debit Card" },
    { value: "paypal", label: "PayPal" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "other", label: "Other" },
  ];

  const currencies = [
    { value: "USD", label: "USD ($)" },
    { value: "EUR", label: "EUR (€)" },
    { value: "GBP", label: "GBP (£)" },
    { value: "INR", label: "INR (₹)" },
    { value: "JPY", label: "JPY (¥)" },
  ];

  return (
    <div className="add-subscription animate-fade-in">
      <div className="page-header">
        <Link to="/dashboard" className="back-link">
          ← Back to Dashboard
        </Link>
        <h1>Add Subscription</h1>
        <p>Track a new recurring payment</p>
      </div>

      <form onSubmit={handleSubmit} className="subscription-form">
        {error && <div className="form-error">{error}</div>}

        <div className="form-section">
          <h2>Basic Information</h2>

          <div className="form-group">
            <label htmlFor="name">Subscription Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Netflix, Spotify"
              required
              minLength={3}
              maxLength={50}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price</label>
              <input
                type="number"
                id="price"
                name="price"
                value={formData.price}
                onChange={handleChange}
                placeholder="0.00"
                required
                min="0"
                step="0.01"
              />
            </div>

            <div className="form-group">
              <label htmlFor="currency">Currency</label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
              >
                {currencies.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="frequency">Billing Cycle</label>
              <select
                id="frequency"
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Category</h2>
          <div className="category-grid">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                className={`category-btn ${
                  formData.catagory === cat.value ? "active" : ""
                }`}
                onClick={() =>
                  setFormData({ ...formData, catagory: cat.value })
                }
              >
                <span className="category-icon">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-section">
          <h2>Payment & Dates</h2>

          <div className="form-group">
            <label htmlFor="payementMethod">Payment Method</label>
            <select
              id="payementMethod"
              name="payementMethod"
              value={formData.payementMethod}
              onChange={handleChange}
            >
              {paymentMethods.map((pm) => (
                <option key={pm.value} value={pm.value}>
                  {pm.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Start Date</label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                required
                max={new Date().toISOString().split("T")[0]}
              />
            </div>

            <div className="form-group">
              <label htmlFor="renewalDate">Next Renewal (Optional)</label>
              <input
                type="date"
                id="renewalDate"
                name="renewalDate"
                value={formData.renewalDate}
                onChange={handleChange}
                min={formData.startDate}
              />
              <span className="form-hint">Auto-calculated if left empty</span>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <Link to="/dashboard" className="btn btn-secondary">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Adding..." : "Add Subscription"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddSubscription;
