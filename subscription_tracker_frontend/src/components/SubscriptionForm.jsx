import { useState, useEffect } from 'react';
import './SubscriptionForm.css';

const CATEGORIES = [
  'Streaming',
  'Software',
  'Gaming',
  'Music',
  'News',
  'Fitness',
  'Cloud Storage',
  'Productivity',
  'Education',
  'Other',
];

const BILLING_CYCLES = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

const COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b',
  '#10b981', '#06b6d4', '#3b82f6', '#6b7280', '#1f2937',
];

const initialFormState = {
  name: '',
  price: '',
  billing_cycle: 'monthly',
  next_billing_date: '',
  category: 'Other',
  color: '#6366f1',
  currency: 'USD',
  notes: '',
};

const SubscriptionForm = ({ subscription, onSubmit, onCancel }) => {
  const [form, setForm] = useState(initialFormState);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (subscription) {
      setForm({
        name: subscription.name || '',
        price: subscription.price || '',
        billing_cycle: subscription.billing_cycle || 'monthly',
        next_billing_date: subscription.next_billing_date?.split('T')[0] || '',
        category: subscription.category || 'Other',
        color: subscription.color || '#6366f1',
        currency: subscription.currency || 'USD',
        notes: subscription.notes || '',
      });
    } else {
      setForm(initialFormState);
    }
  }, [subscription]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Name is required';
    if (!form.price || form.price <= 0) newErrors.price = 'Valid price is required';
    if (!form.next_billing_date) newErrors.next_billing_date = 'Next billing date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validate()) {
      onSubmit({
        ...form,
        price: parseFloat(form.price),
      });
    }
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{subscription ? 'Edit Subscription' : 'Add Subscription'}</h2>
          <button className="btn-close" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="subscription-form">
          <div className="form-group">
            <label htmlFor="name">Subscription Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g., Netflix, Spotify"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="price">Price *</label>
              <input
                type="number"
                id="price"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="9.99"
                step="0.01"
                min="0"
                className={errors.price ? 'error' : ''}
              />
              {errors.price && <span className="error-message">{errors.price}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="currency">Currency</label>
              <select
                id="currency"
                name="currency"
                value={form.currency}
                onChange={handleChange}
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="CAD">CAD ($)</option>
                <option value="AUD">AUD ($)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="billing_cycle">Billing Cycle</label>
              <select
                id="billing_cycle"
                name="billing_cycle"
                value={form.billing_cycle}
                onChange={handleChange}
              >
                {BILLING_CYCLES.map((cycle) => (
                  <option key={cycle.value} value={cycle.value}>
                    {cycle.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="next_billing_date">Next Billing Date *</label>
              <input
                type="date"
                id="next_billing_date"
                name="next_billing_date"
                value={form.next_billing_date}
                onChange={handleChange}
                className={errors.next_billing_date ? 'error' : ''}
              />
              {errors.next_billing_date && (
                <span className="error-message">{errors.next_billing_date}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={form.category}
              onChange={handleChange}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Color</label>
            <div className="color-picker">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`color-option ${form.color === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setForm((prev) => ({ ...prev, color }))}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              placeholder="Additional notes..."
              rows="3"
            />
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {subscription ? 'Update' : 'Add'} Subscription
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubscriptionForm;
