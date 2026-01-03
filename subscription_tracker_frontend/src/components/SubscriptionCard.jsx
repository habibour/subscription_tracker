import { useState } from "react";
import "./SubscriptionCard.css";

const SubscriptionCard = ({ subscription, categoryColor, onDelete }) => {
  const [showActions, setShowActions] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getDaysUntilRenewal = () => {
    const renewal = new Date(subscription.renewalDate);
    const today = new Date();
    const diffTime = renewal - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const handleDelete = async () => {
    setDeleting(true);
    await onDelete(subscription._id);
    setDeleting(false);
    setShowConfirm(false);
  };

  const daysUntil = getDaysUntilRenewal();

  const getStatusClass = () => {
    if (subscription.status === "canceled") return "status-canceled";
    if (subscription.status === "inactive") return "status-inactive";
    if (daysUntil <= 7 && daysUntil > 0) return "status-warning";
    if (daysUntil <= 0) return "status-overdue";
    return "status-active";
  };

  const getCategoryIcon = () => {
    const icons = {
      entertainment: "◈",
      productivity: "◇",
      education: "△",
      health: "○",
      other: "□",
    };
    return icons[subscription.catagory] || icons.other;
  };

  const formatPrice = () => {
    const symbols = { USD: "$", EUR: "€", GBP: "£", INR: "₹", JPY: "¥" };
    const symbol = symbols[subscription.currency] || "$";
    return `${symbol}${subscription.price.toFixed(2)}`;
  };

  return (
    <div
      className={`subscription-card ${getStatusClass()}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="card-header">
        <div className="card-icon" style={{ backgroundColor: categoryColor }}>
          {getCategoryIcon()}
        </div>
        <div className="card-info">
          <h3>{subscription.name}</h3>
          <span className="card-category">{subscription.catagory}</span>
        </div>
        <div className="card-price">
          <span className="price-amount">{formatPrice()}</span>
          <span className="price-frequency">
            /{subscription.frequency === "monthly" ? "mo" : "yr"}
          </span>
        </div>
      </div>

      <div className="card-details">
        <div className="card-detail">
          <span className="detail-label">Next renewal</span>
          <span className="detail-value">
            {formatDate(subscription.renewalDate)}
          </span>
        </div>
        <div className="card-detail">
          <span className="detail-label">Status</span>
          <span className={`status-badge ${subscription.status}`}>
            {subscription.status}
          </span>
        </div>
      </div>

      {daysUntil > 0 && daysUntil <= 7 && (
        <div className="card-alert">
          ⚠️ Renews in {daysUntil} day{daysUntil !== 1 ? "s" : ""}
        </div>
      )}

      <div className={`card-actions ${showActions ? "visible" : ""}`}>
        {showConfirm ? (
          <div className="confirm-actions">
            <span className="confirm-text">Delete?</span>
            <button
              className="action-btn confirm-yes"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "..." : "Yes"}
            </button>
            <button
              className="action-btn confirm-no"
              onClick={() => setShowConfirm(false)}
            >
              No
            </button>
          </div>
        ) : (
          <button
            className="action-btn delete"
            onClick={() => setShowConfirm(true)}
            aria-label="Delete subscription"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
};

export default SubscriptionCard;
