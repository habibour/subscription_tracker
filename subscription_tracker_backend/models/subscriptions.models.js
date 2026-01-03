import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Subscription name is required"],
      trim: true,
      minLength: 3,
      maxLength: 50,
    },
    price: {
      type: Number,
      required: [true, "Subscription price is required"],
      min: 0,
    },
    currency: {
      type: String,
      enum: ["USD", "EUR", "GBP", "INR", "JPY"],
      default: "USD",
    },
    frequency: {
      type: String,
      enum: ["monthly", "yearly"],
      required: [true, "Subscription frequency is required"],
    },
    catagory: {
      type: String,
      enum: ["entertainment", "productivity", "education", "health", "other"],
      default: "other",
      required: [true, "Subscription catagory is required"],
    },
    payementMethod: {
      type: String,
      enum: ["credit_card", "debit_card", "paypal", "bank_transfer", "other"],
      default: "other",
      required: [true, "Subscription payement method is required"],
    },
    status: {
      type: String,
      enum: ["active", "inactive", "canceled"],
      default: "active",
      required: [true, "Subscription status is required"],
    },
    startDate: {
      type: Date,
      required: [true, "Subscription start date is required"],
      validate: {
        validator: function (value) {
          return value <= new Date();
        },
        message: "Start date cannot be in the future",
      },
    },
    endDate: {
      type: Date,
      validate: {
        validator: function (value) {
          return !value || value > this.startDate;
        },
        message: "End date must be after start date",
      },
    },
    renewalDate: {
      type: Date,
      required: [true, "Subscription renewal date is required"],
      validate: {
        validator: function (value) {
          return value > this.startDate;
        },
        message: "Renewal date must be after start date",
      },
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// auto calc renewalDate before saving
subscriptionSchema.pre("save", function () {
  if (!this.renewalDate) {
    const start = new Date(this.startDate) || new Date();
    if (this.frequency === "monthly") {
      this.renewalDate = new Date(start.setMonth(start.getMonth() + 1));
    } else if (this.frequency === "yearly") {
      this.renewalDate = new Date(start.setFullYear(start.getFullYear() + 1));
    }
  }
});
// index for user and status to optimize queries

const Subscription = mongoose.model("Subscription", subscriptionSchema);

export default Subscription;
