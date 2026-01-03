import './Dashboard.css';

const Dashboard = ({ subscriptions }) => {
  const calculateTotals = () => {
    const totals = {
      monthly: 0,
      yearly: 0,
      count: subscriptions.length,
      upcoming: 0,
    };

    const today = new Date();
    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

    subscriptions.forEach((sub) => {
      const price = parseFloat(sub.price) || 0;
      
      // Normalize to monthly amount
      let monthlyAmount = price;
      switch (sub.billing_cycle) {
        case 'weekly':
          monthlyAmount = price * 4.33;
          break;
        case 'quarterly':
          monthlyAmount = price / 3;
          break;
        case 'yearly':
          monthlyAmount = price / 12;
          break;
        default:
          monthlyAmount = price;
      }

      totals.monthly += monthlyAmount;
      totals.yearly += monthlyAmount * 12;

      // Check if upcoming
      const nextBilling = new Date(sub.next_billing_date);
      if (nextBilling >= today && nextBilling <= weekFromNow) {
        totals.upcoming++;
      }
    });

    return totals;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totals = calculateTotals();

  const stats = [
    {
      label: 'Monthly Spend',
      value: formatCurrency(totals.monthly),
      icon: '📅',
      color: '#6366f1',
    },
    {
      label: 'Yearly Spend',
      value: formatCurrency(totals.yearly),
      icon: '📊',
      color: '#10b981',
    },
    {
      label: 'Active Subscriptions',
      value: totals.count,
      icon: '🔄',
      color: '#8b5cf6',
    },
    {
      label: 'Due This Week',
      value: totals.upcoming,
      icon: '⏰',
      color: totals.upcoming > 0 ? '#f59e0b' : '#6b7280',
    },
  ];

  return (
    <div className="dashboard">
      {stats.map((stat, index) => (
        <div key={index} className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: `${stat.color}15` }}>
            <span>{stat.icon}</span>
          </div>
          <div className="stat-content">
            <span className="stat-value" style={{ color: stat.color }}>
              {stat.value}
            </span>
            <span className="stat-label">{stat.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
