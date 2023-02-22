import mongoose from "mongoose";
const { ObjectId, Date } = mongoose.SchemaTypes;

const requestDataSchema = new mongoose.Schema({
  id: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    required: [true, "status is required"],
    default: "pending",
  },
  reject_msg: {
    type: String,
    default: "",
  },
});

const requestSchema = new mongoose.Schema(
  {
    employee_id: {
      type: ObjectId,
      ref: "Employee",
      required: [true, "employee id is required"],
    },
    type: {
      type: String,
      enum: ["sick", "casual", "exigency", "optional"],
      required: [true, "leave category is required"],
    },
    date: {
      type: [Date],
      required: [true, "leave date is required"],
    },
    message: {
      type: String,
      default: "Please approve my leave req",
    },
    leaveCount: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["pending", "partiallyApproved", "approved", "rejected"],
      required: [true, "status is required"],
      default: "pending",
    },
    // receiver: [requestDataSchema],
    Manager: requestDataSchema,
    HR: requestDataSchema,
    sendNotification: [
      {
        receiver_id: {
          type: ObjectId,
          ref: "Employee",
        },
      },
    ],
    resolved_by: {
      type: ObjectId,
      ref: "Employee",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);
const leaveRequest = mongoose.model("leaveRequest", requestSchema);
export default leaveRequest;
