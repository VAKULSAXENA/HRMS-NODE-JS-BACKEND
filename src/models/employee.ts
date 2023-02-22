import mongoose, { Mongoose, ObjectId } from "mongoose";

const { ObjectId } = mongoose.SchemaTypes;
interface User {
  name: string;
  email: string;
  mobile: number;
  emergency_contact: number;
  dob: string;
  address: string;
  password: string;
  verified: string;
  role: string;
  documents: [
    {
      document_name: string;
      s3_url: string;
    }
  ];
  bank_details: {
    bank_name: string;
    bank_ifsc: string;
    account_number: number;
    account_holder_name: string;
  };
  optionalDetails:{
    MBTI : string,
    useless_talent : string,
    one_food : string,
    friends_describe : string,
    ultimate_goal : string,
    tshirt: string
  }
  leave_data: [{ leave_type: string; leave_left: number }];
  assigned_HR: ObjectId;
  assigned_Manager: ObjectId;
  salary_details: object;
  salary_slips: [slip_key: string];
  leave_dates: [];
}
const optionalDetailsSchema =new mongoose.Schema({
  MBTI :String,
  useless_talent :String,
  one_food :String,
  friends_describe :String,
  ultimate_goal :String,
  tshirt :String
})
const documentSchema = new mongoose.Schema({
  document_name: {
    type: String,
  },
  s3_url: {
    type: String,
  },
});
const bankSchema = new mongoose.Schema({
  bank_name: String,
  bank_ifsc: String,
  account_holder_name: String,
  account_number: Number,
});
const salarySchema = new mongoose.Schema({
  basic: Number,
  hra: Number,
  lta: Number,
  misc: Number,
});

const employeeSchema = new mongoose.Schema<User>(
  {
    name: {
      type: String,
      // required: [true, 'name is required'],
    },
    email: {
      type: String,
      unique: true,
      required: [true, "email is required"],
    },
    mobile: {
      type: Number,
    },
    emergency_contact: {
      type: Number,
    },
    dob: {
      type: String,
    },
    address: {
      type: String,
    },
    password: {
      type: String,
      default: "Welcome@123",
      // required: [true, "password is required"],
      select: false,
    },
    role: {
      type: String,
      enum: ["Employee", "HR", "TL"],
      default: "Employee",
    },
    verified: {
      type: String,
      enum: ["false", "true", "pending"],
      default: "false",
    },
    documents: {
      type: [documentSchema],
      select: false,
    },
    leave_data: [
      {
        leave_type: {
          type: String,
          default: "sick",
          // required:[true,"leave category is required."]
        },
        leave_left: {
          type: Number,
          default: 4,
        },
      },
    ],
    leave_dates: {
      type: [Date],
    },
    assigned_HR: {
      type: ObjectId,
      //ref:"Employee"
    },
    assigned_Manager: {
      type: ObjectId,

      //  ref:"Employee"
    },
    optionalDetails:{
      type:optionalDetailsSchema
    },
    bank_details: {
      type: bankSchema,
      select: false,
    },
    salary_details: {
      type: salarySchema,
      select: false,
    },
    salary_slips: {
      type: [String],
      select: false,
    },
  },
  {
    timestamps: true,
  }
);
const Employee = mongoose.model("Employee", employeeSchema);

export default Employee;
