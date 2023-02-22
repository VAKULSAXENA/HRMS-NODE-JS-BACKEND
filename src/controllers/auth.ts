import { Request, Response } from "express";
import Employee from "../models/employee";
import { config } from "dotenv";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import transport from "./util/gmailApi";
config();

const OneDayInSec = 1 * 24 * 60 * 60;

const hrmsLink: string = process.env.HRMSLINK || "";
const emailNonceblox: string = process.env.EMAILNONCEBLOX || "";
const secret: string = process.env.ACCESS_TOKEN_SECRET || "secret";

const getToken = (_id: any) => {
  const token = jwt.sign({ _id }, secret, {
    expiresIn: OneDayInSec,
  });
  return token;
};
const __prod__ = process.env.NODE_ENV === "production";
const devCookieConfig = {
  httpOnly: true,
};
const prodCookieConfig = {
  httpOnly: true,
  sameSite: "None",
  secure: __prod__,
};
const cookieConfig = __prod__ ? prodCookieConfig : devCookieConfig;

const register = async (req: Request, res: Response) => {
  try {
    const { email, hr } = req.body;
    const leave_data = [
      { leave_type: "sick", leave_left: "10" },
      { leave_type: "casual", leave_left: "10" },
      { leave_type: "exigency", leave_left: "10" },
      { leave_type: "optional", leave_left: "10" },
    ];
    const randompassword = Math.random().toString(36).slice(-8);
    // console.log(randompassword);
    // console.log(req.body);
    if (!email || !hr) {
      res
        .status(400)
        .json({ status: "400", log: "Please fill in all details" });
      return;
    }
    const check_employee = await Employee.findOne({ email: email });
    if (check_employee?.email) {
      res
        .status(400)
        .json({ status: "400", log: "User with this email already exist." });
      return;
    }
    const employ: any = await Employee.findById({ _id: hr });
    // console.log(employ);
    if (!employ || employ.role !== "HR") {
      res
        .status(400)
        .json({ status: "400", log: "Assigned admin is not valid" });
      return;
    }
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(randompassword, salt);
    const employee = new Employee({
      email,
      password: hashed,
      assigned_HR: hr,
      assigned_Manager: hr,
      leave_data,
    });
    await employee.save();
    res.status(200).json({
      status: "200",
      log: "Successfully registered", randompassword
    });

    const mailOptions = {
      to: `${email}`,
      from: `Nonceblox <${emailNonceblox}>`,
      subject: "Onboarding at Nonceblox",
      html: `<h2>Welcome Onboard!</h2>Hi there! Your required credentials have been included below for your reference - <br>
      Email ID : ${email}<br>
      Default password : ${randompassword}<br>
      Portal login link  :${hrmsLink}<br>
      On your first login, Please change your password.`,
    };
    await transport.sendMail(mailOptions)
      .then(() => {
        console.log("Email sent");
      });
  } catch (e) {
    console.log("error: ",e)
    // if error code is 1101 then duplicate error or validation error
    if (e.code === 1101) {
      return res
        .status(400)
        .json({ log: "User with this email already exist" });
    }
    // validation error
    if (e._message) {
      res.status(400).json({ status: "400", log: e._message });
      return;
    }
    res.status(500).json({
      status: "500",
      log: "Server error, try again later"
    });
    return;
  }
};

//verify an employee by HR
const verify = async (req: Request, res: Response) => {
  try {
    const { email, status } = req.body;
    if (!email || !status)
      return res
        .status(400)
        .json({ status: "400", log: "Please fill in all details" });
    if (status !== "true" && status !== "false")
      return res
        .status(400)
        .json({ status: "400", log: "status must be either true or false" });

    await Employee.findOneAndUpdate(
      { email: email },
      { $set: { verified: status } },
      { new: true },
      (err, doc) => {
        if (err) {
          // console.log("Something went wrong while updating the data!");
        }
      }
    ).clone();
    res.status(200).json({ status: "200", log: "Employee info updated" });
  } catch (e) {
    res.status(500).json({ status: "500", log: e.message });
  }
};

const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res
        .status(400)
        .json({ status: "400", log: "Please fill in all details" });
      return;
    }
    const employee = await Employee.findOne(
      { email },
      function (err: any, obj: any) {
        if (err) {
          return res.status(404).json({ log: err });
        }
      }
    )
      .select("+password")
      .clone();
    if (employee) {
      // compare password
      const passwordMatch = await bcrypt.compare(password, employee.password);
      if (passwordMatch) {
        // set cookie
        res.cookie("user", getToken(employee._id), {
          maxAge: OneDayInSec * 1000,
          ...cookieConfig,
        });
        employee.password = "";
        res.status(200).json({
          status: "200",
          log: "Logged in successfully!",
          employee,
        });
      } else {
        res.status(400).json({ status: "400", log: "Incorrect credentials" });
      }
    } else {
      res.status(404).json({ status: "404", log: "User not found" });
    }
  } catch (e) {
    // console.error(e);
    res
      .status(500)
      .json({ status: "500", log: "Server error, try again later" });
  }
};

//Change Password

const changePassword = async (req: Request, res: Response) => {
  try {
    const { email, password, newPassword } = req.body;
    if (!email || !password || !newPassword) {
      res
        .status(400)
        .json({ status: "400", log: "Please fill in all details" });
      return;
    }
    const employee = await Employee.findOne(
      { email },
      function (err: any, obj: any) {
        if (err) {
          return res.status(404).json({ log: err });
        }
      }
    )
      .select("password")
      .clone();
    if (employee) {
      // compare password
      const passwordMatch = await bcrypt.compare(password, employee.password);
      if (!passwordMatch) {
        return res.status(404).json({ log: "Incorrect Password" });
      }
      if (passwordMatch) {
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(newPassword, salt);
        await Employee.findOneAndUpdate(
          { email: email },
          { $set: { password: hashed } },
          { new: true },
          (err, doc) => {
            if (err) {
              // console.log("Something wrong when updating password!");
            }
          }
        ).clone();

        res
          .status(200)
          .json({ status: "200", log: "Password succesfully changed" });
      } else {
        res.status(400).json({ status: "400", log: "Incorrect credentials" });
      }
    } else {
      res.status(404).json({ status: "404", log: "User not found" });
    }
  } catch (e) {
    // console.error(e);
    res
      .status(500)
      .json({ status: "500", log: "Server error, try again later" });
  }
};

//all employees
const getEmployees = async (req: Request, res: Response) => {
  try {
    const employee = await Employee.find({}).select("+documents");
    res.status(200).json({ status: "200", log: "Employees info", employee });
  } catch (e) {
    res.status(500).json({ status: "500", log: e.message });
  }
};
//assign role like tl,hr..
const updateRole = async (req: Request, res: Response) => {
  try {
    if (
      req.body.role !== "HR" &&
      req.body.role !== "TL" &&
      req.body.role !== "Employee"
    ) {
      res.status(404).json({ status: "404", log: "Invalid role" });
      return;
    }
    Employee.findOneAndUpdate(
      { email: req.body.email },
      { $set: { role: req.body.role } },
      { new: true },
      (err, doc) => {
        if (err) {
          // console.log("Something wrong when updating data!");
        }
      }
    ).clone();
    res.status(200).json({ status: "200", log: "Employee info updated" });
  } catch (e) {
    res.status(500).json({ status: "500", log: e.message });
  }
};

//assign or update manager
const manager = async (req: Request, res: Response) => {
  try {
    const { email, manager_id } = req.body;
    if (!email || !manager_id) {
      res.status(404).json({
        status: "404",
        log: "Please provide user email  and manager_id",
      });
      return;
    }
    Employee.findOneAndUpdate(
      { email },
      { $set: { assigned_Manager: manager_id } },
      { new: true },
      (err, doc) => {
        if (err) {
          // console.log("Something went wrong while updating the data!");
        }
      }
    ).clone();
    res.status(200).json({ status: "200", log: "Employee info updated" });
  } catch (e) {
    res.status(500).json({ status: "500", log: e.message });
  }
};

//update admin
const admin = async (req: Request, res: Response) => {
  try {
    const { email, admin_id } = req.body;
    if (!email || !admin_id) {
      res.status(404).json({
        status: "404",
        log: "Please provide user email  and admin_id",
      });
      return;
    }
    Employee.findOneAndUpdate(
      { email },
      { $set: { assigned_HR: admin_id } },
      { new: true },
      (err, doc) => {
        if (err) {
          // console.log("Something wrong when updating data!");
        }
      }
    ).clone();
    res.status(200).json({ status: "200", log: "Employee info updated" });
  } catch (e) {
    res.status(500).json({ status: "500", log: e.message });
  }
};

//current employee stored in cookie
const currentEmployee = (req: Request, res: Response) => {
  const User = res.locals.user;
  res.status(200).json({ status: "200", log: "current user", User });
};

//particular employee
const getEmployee = async (req: Request, res: Response) => {
  try {
    const { _id } = req.params;
    const user: any = await Employee.findOne({ _id })
      .select("+documents +bank_details +salary_slips +salary_details")
      .clone();

    res.status(200).json({ status: "200", log: "user info", user });
  } catch (e) {
    res.status(500).json({ status: "500", log: e.message });
  }
};

const logout = (req: Request, res: Response) => {
  // res.cookie("user", null, { maxAge: 0, ...cookieConfig });
  res.clearCookie("user", { ...cookieConfig });
  return res.status(200).json({ log: "Logout Succesfully" });
};

//upload personal details and change verified status to pending
const UploadPersonalDetails = async (req: Request, res: Response) => {
  try{
  const {
    id,
    name,
    mobile,
    emergency_contact,
    dob,
    address,
    bank_name,
    bank_ifsc,
    account_number,
    account_holder_name,MBTI,useless_talent,one_food,friends_describe,ultimate_goal,tshirt
  } = req.body;

  if (
    !id ||
    !name ||
    !mobile ||
    !emergency_contact ||
    !dob ||
    !address ||
    !bank_ifsc ||
    !bank_name ||
    !account_holder_name ||
    !account_number
  ) {
    res
      .status(404)
      .json({ status: "404", log: "Please provide all details and user id" });
    return;
  }
  try {
    const bank_details = {
      bank_name,
      bank_ifsc,
      account_holder_name,
      account_number,
    };
    const optionalDetails={
      MBTI,
      useless_talent,
      one_food,
      friends_describe,
      ultimate_goal,
      tshirt
    }
    await Employee.findOneAndUpdate(
      { _id: id },
      { $set: { name, mobile, emergency_contact, address, dob, bank_details,optionalDetails } },
      { new: true },
      (err, doc) => {
        if (err) {
          // console.log("Something wrong when updating data!");
          //return res.status(404).json({ log: "Profile Updation failed" });
        }
      }
    ).clone();
   
    await Employee.findOneAndUpdate(
      { _id: id },
      { $set: { verified: "pending" } },
      { new: true },
      (err, doc) => {
        if (err) {
          // console.log("Something wrong when updating data!");
        }
      }
    ).clone();
    return res.status(200).json({
      status: "200",
      log: "Employee onbarded,waiting for admin to verify",
    });
  } catch (e) {
    if (e) return res.status(500).json({ log: e.message });
  }
}
catch(err)
{
  return res.status(500).json({ log: err.message });
}
};

export {
  login,
  register,
  getEmployees,
  updateRole,
  logout,
  getEmployee,
  currentEmployee,
  verify,
  manager,
  admin,
  changePassword,
  UploadPersonalDetails,
};
