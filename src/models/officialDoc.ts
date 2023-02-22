import mongoose from "mongoose";
const standardholidayschema = new mongoose.Schema({
  name: String,
  date: Date,
});

const officialDocSchema = new mongoose.Schema(
  {
    leave_holiday_policy: {
      type: String,
      default: " ",
    },
    employee_handbook: {
      type: String,
      default: " ",
    },
    standard_holidays: {
      type: [standardholidayschema],
      select: false,
      default: [],
    },
    optional_holidays: {
      type: [standardholidayschema],
      select: false,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);
const officialDoc = mongoose.model("officialDoc", officialDocSchema);
export default officialDoc;
