import './EmptyState.css';

const EmptyState = ({ onAddClick }) => {
  return (
    <div className="empty-state">
      <div className="empty-icon">📭</div>
      <h2>No subscriptions yet</h2>
      <p>Start tracking your subscriptions to stay on top of your spending.</p>
      <button className="btn btn-primary" onClick={onAddClick}>
        Add Your First Subscription
      </button>
    </div>
  );
};

export default EmptyState;
