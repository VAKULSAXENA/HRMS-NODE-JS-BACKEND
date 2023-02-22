import transport from "./util/gmailApi";
import Employee from "../models/employee";
import { Request, Response } from "express";
import leaveRequest from "../models/request";
import officialDoc from "../models/officialDoc";

const EMAILNONCEBLOX: string = process.env.EMAILNONCEBLOX || "";

interface IGetUserAuthInfoRequest extends Request {
  user?: any;
}

//create leave req
const CREATE = async (req: IGetUserAuthInfoRequest, res: Response) => {
  const { data, category, message } = req.body;
  // console.log("here"+typeof(data[0]));
  const employee_id: any = req.body.user._id;
  const receivers: object[] = req.body.receivers;

  if (!data || !employee_id || !receivers || !category) {
    return res.status(400).json({ log: "Please fill all the fields" });
  }

  const employee: any = await Employee.find(
    { _id: employee_id, "leave_data.leave_type": category },
    { _id: 0, leave_data: { $elemMatch: { leave_type: category } } }
  );
  //validating
  // console.log(employee);
  if (!employee.length) {
    return res.status(404).json({ log: "Something went wrong" });
  }
  const [leave_data] = employee;
  const leave_left = leave_data?.leave_data[0]?.leave_left;
  const employe1: any = await Employee.find({ _id: employee_id });
  let manag, hr;
  // console.log(employe1[0]._id);
  // console.log(employe1.assigned_Manager);
  // console.log(employe1.assigned_HR);
  if (!employe1.length)
    return res.status(404).json({ log: "Employee not found" });
  if (employe1[0]) {
    if (employe1[0].assigned_HR) {
      hr = employe1[0].assigned_HR;
    }
    if (employe1[0].assigned_Manager) manag = employe1[0].assigned_Manager;
  }

  try {
    const alreadyTakenLeaves: Date[] = employe1[0].leave_dates;
    const leaveDates = data.map((date: any) =>
      stringToDate(date, "MM/dd/yyyy", "/")
    );
    const start = leaveDates[0];
    const end = leaveDates[leaveDates.length - 1];

    const doc: any = await officialDoc
      .find({})
      .select("+standard_holidays +optional_holidays");
    let standard_holidays, optional_holidays;
    if (doc.length > 0) {
      standard_holidays = doc[0].standard_holidays;
      optional_holidays = doc[0].optional_holidays;
    }

    const leave_Dates = [];
    let loop: Date = new Date(start);
    let leaveCount = 0;
    var today = new Date();
     today.setHours(0,0,0,0);
    if (category !== "optional")
      while (loop <= end) {
        //filters already approved leave dates
        const match = alreadyTakenLeaves.find(
          (d) => d.getTime() === loop.getTime()
        );
        const hasMatch = !!match; // convert to boolean
        //filter standard holidays from leave requests
        const standardholidaymatch: any = standard_holidays.find(
          (d: any) => d.date.getTime() === loop.getTime()
        );
        const hasmatch2 = !!standardholidaymatch;
        if (
          loop.getDay() !== 6 &&
          loop.getDay() !== 0 &&
          !hasMatch &&
          !hasmatch2 && loop>=today
        ) {
          leaveCount = leaveCount + 1;
          leave_Dates.push(new Date(loop)); //.toLocaleString(undefined, {timeZone: 'Asia/Kolkata'}));
        }
        const newDate = loop.setDate(loop.getDate() + 1);
        loop = new Date(newDate);
      }
    else {
      let flag = 0;
      while (loop <= end) {
        //filter already approved leave dates

        const match = alreadyTakenLeaves.find(
          (d) => d.getTime() === loop.getTime()
        );
        const hasMatch = !!match; // convert to boolean
        //filter standard holidays from leave requests
        const standardholidaymatch: any = standard_holidays.find(
          (d: any) => d.date.getTime() === loop.getTime()
        );
        const hasmatch2 = !!standardholidaymatch;

        const optionalHolidays = optional_holidays.find(
          (d: any) => d.date.getTime() === loop.getTime()
        );
        const hasmatch3 = !!optionalHolidays;
        if (!hasmatch3) flag = 1;
        if (
          loop.getDay() !== 6 &&
          loop.getDay() !== 0 &&
          !hasMatch &&
          !hasmatch2 && loop>=today
        ) {
          leaveCount = leaveCount + 1;
          leave_Dates.push(new Date(loop)); //.toLocaleString(undefined, {timeZone: 'Asia/Kolkata'}));
        }
        const newDate = loop.setDate(loop.getDate() + 1);
        loop = new Date(newDate);
      }

      if (flag) {
        res
          .status(400)
          .json({ msg: "Some dates might not fall under optional category" });
        return;
      } 
     }
      if (leaveCount === 0) {
      res.status(400).json({
        msg: "Invalid dates,possible causes(holidays,already approved leave dates ..)",
      });
      return;
    } else if (leaveCount > leave_left) {
      res
        .status(400)
        .json({ msg: "Remaining leaves in this category is low" });
      return;
    }
  
     
    const request = new leaveRequest({
      employee_id,
      type: category,
      date: leave_Dates,
      message,
      leaveCount,
      Manager: {
        id: manag,
      },
      HR: {
        id: hr,
      },
      sendNotification: receivers,
    });
    await request.save();
    return res.send(request);
  } catch (e) {
    console.log(e);
    res.status(500).send(e.message);
  }
};
//for scaling purpose
const RESOLVE = async (req: IGetUserAuthInfoRequest, res: Response) => {
  const resolved_by = req.body.user._id;
  const { _id, status } = req.body;

  if (!_id || !status) {
    return res.status(400).send("Please fill the status and request id");
  }
  // console.log(req.body);
  // updating the issue:
  // two methods only => Accept and decline.
  if (status !== "approved" && status !== "rejected") {
    return res.status(400).json({ log: "Invalid status" });
  }

  try {
    const request = await leaveRequest.findOne({ _id });
    if (!request) {
      return res.status(404).send("Request not found");
    }
    // if the action is rejected dont do anything.
    if (status === "rejected") {
      request.resolved_by = resolved_by;
      request.status = "rejected";
      const newData = await request.save();
      return res.status(200).json({ log: "Request has been rejected" });
    }

    // work on accept for different types
    const { employee_id, type, data } = request;
    // at last marking request as approved
    request.resolved_by = resolved_by;
    request.status = "approved";
    const newData = await request.save();
    return res.status(200).json({ log: "Request has been approved" });
  } catch (e) {
    // console.log(e);
    res.status(500).send(e.message);
  }
};

//Approve or Reject request
const RESOLVE_INDIVIDUAL = async (
  req: IGetUserAuthInfoRequest,
  res: Response
) => {
  const request_id = req.body.id;
  const user_id = req.body.userId;
  const status = req.body.status;
  const msg = req.body.msg;

  if (!request_id || !status||!user_id) {
    return res.status(400).send("Please fill the status and request id");
  }
 console.log(req.body);
  // updating the issue:
  // two methods only => Accept and reject.
  if (status !== "approved" && status !== "rejected") {
    return res.status(400).json({ log: "Invalid status" });
  }
  const leav = await leaveRequest.findOne({ _id: request_id });

  try {
    let is_hr = "false";
    if (leav.status === "partiallyApproved") {
      is_hr = "true";
      if (leav.HR.id !== user_id) {
        return res.status(404).json({ log: "Unauthorized Request!" });
      }
    } else {
      if (leav.Manager.id !== user_id) {
        return res.status(404).json({ log: "Unauthorized Request!" });
      }
    }
    if (leav.status !== "pending" && leav.status !== "partiallyApproved") {
      return res.status(400).json({ log: "request already resolved!" });
    }
    const leave = await leaveRequest.findOne({ _id: request_id });
    const user:any=await Employee.findOne({"_id":leave.employee_id});
    const userName=user?.email;
    const employee = await Employee.find(
      { _id: leave.employee_id, "leave_data.leave_type": leave.type },
      { _id: 0, leave_data: { $elemMatch: { leave_type: leave.type } } }
    );
    const [leave_data] = employee;
    const leave_left: any = leave_data?.leave_data[0]?.leave_left;
    const new_leave_left = leave_left - leave.leaveCount;
    if (is_hr === "false") {
      await leaveRequest
        .findOneAndUpdate(
          {
            _id: request_id,
          },
          {
            $set: {
              "Manager.status": status,
              "Manager.reject_msg": msg ? msg : "",
            },
          },
          { new: true },
          (err, doc) => {
            if (err) {
              // console.log("Something wrong when updating data!");
            }
          }
        )
        .clone();
    } else {
      await leaveRequest
        .findOneAndUpdate(
          {
            _id: request_id,
          },
          {
            $set: {
              "HR.status": status,
              "HR.reject_msg": msg ? msg : "",
            },
          },
          { new: true },
          (err, doc) => {
            if (err) {
              // console.log("Something wrong when updating data!");
            }
          }
        )
        .clone();
    }

    //updating final status of request if approved/rejected by all receivers.

    if (status === "rejected") {
      leave.status = "rejected";
      await leave.save();
      return res.status(200).json({ log: "Request has been resolved" });
    } else if (new_leave_left < 0) {
      return res
        .status(404)
        .json({ status: "404", log: "Not that much leave remaining" });
    } else {
      if (is_hr === "true") {
        leave.status = "approved";
        await leave.save();

        await Employee.findOneAndUpdate(
          {
            _id: leave.employee_id,
            "leave_data.leave_type": leave.type,
          },
          {
            $set: {
              "leave_data.$.leave_left": new_leave_left,
            },
          },
          { new: true },
          (err, doc) => {
            if (err) {
              // console.log("Something wrong when updating data!");
            }
          }
        ).clone();

        await Employee.findOneAndUpdate(
          {
            _id: leave.employee_id,
          },
          {
            $push: {
              leave_dates: { $each: leave.date },
            },
          }
        ).clone();

        //sending notification to concerned employees 
        const user_emails:any=[];
        let notification_email:any=[];
        const receivers_id:any=leave?.sendNotification;
        for(let i=0;i<receivers_id.length;i++) {
          const employe:any=await Employee.findOne({"_id":receivers_id[i].receiver_id});
          user_emails.push(employe.email);
        }
        let managerId:any=leave?.Manager.id;
        const hrId=leave?.HR.id;
        const manager=await Employee.findOne({"_id":managerId});
        const managerEmail=manager?.email;
        const hr=await Employee.findOne({"_id":hrId});
        const hrEmail=hr?.email;
        user_emails.push(managerEmail);
        user_emails.push(hrEmail);
        const allEmails:any= new Set();
        for(let i=0;i<user_emails.length;i++) {
          //console.log(user_emails[i]);
          allEmails.add(user_emails[i]);
        }
        allEmails.add(userName);
        notification_email= Array.from(allEmails);
        let from=leave.date[0];
        from.toLocaleString()
        let to=leave.date[leave.date.length-1];
        to.toLocaleString()
        
        const fromFormatted = from.toString().slice(0,15)
        const toFormatted = to.toString().slice(0,15)

        for( let i = 0; i < notification_email.length; i++) {
          const mailOptions = {
            to: [notification_email[i]],
            from: `Nonceblox <${EMAILNONCEBLOX}>`,
            subject: "Leave Notification",
            html: `Hi, we would like to inform you that ${userName} will be on leave from ${fromFormatted} to ${toFormatted}`,
          };
          await  transport.sendMail(mailOptions)
          .then(() => {
            // console.log("Email sent");
          })
          .catch((error:any) => {
            console.log(error);
          });
        }
        return res.status(200).json({
          status: "200",
          log: "Request has been resolved",
          email:notification_email
        });
      } else {
        leave.status = "partiallyApproved";
        const newData = await leave.save();
        return res.status(200).json({
          status: "200",
          log: "Request has been sent to admin for approval",
        });
      }
    }
  } catch (e) {
    // console.log(e);
    res.status(500).send(e.message);
  }
};

//Delete request
const DELETE = async (req: Request, res: Response) => {
  const { _id } = req.body;
  if (!_id) {
    return res.status(400).send("Send the _id of request to delete");
  }
  try {
    const leave = await leaveRequest.findOne({ _id });
    if (leave.employee_id === req.body.user) {
      res.status(404).send("You cannot delete the request!");
    } else {
      const deleteRequest = await leaveRequest.deleteOne({ _id });
      return res.status(200).json({ log: "Request has been deleted" });
    }
  } catch (e) {
    // console.log(e);
    return res.status(400).send(e.message);
  }
};
//Check requests sent for you
const GETREQUESTS = async (req: Request, res: Response) => {
  const _id: string = req.params.id;
 //console.log(_id);
  if (!_id) {
    return res.status(400).send("Send current user ID");
  }
  try {
    const hr_requests = [];
    const notification = [];
    const requests = await leaveRequest.find({ "HR.id": _id });
    for (let i = 0; i < requests.length; i++) {
      const employe_id = requests[i].employee_id;
      if (requests[i].status === "partiallyApproved") {
        hr_requests.push(requests[i]);
      }
    }

    const manager_requests = await leaveRequest
      .find({$and:[{ "Manager.id": _id },{"status":"pending"}]})
      .clone();

    const all_notification = await leaveRequest.find({
      $and: [
        { status: "approved" },
        { sendNotification: { $elemMatch: { receiver_id: _id } } },
      ],
    });

    if (
      manager_requests.length > 0 ||
      hr_requests.length > 0 ||
      all_notification.length > 0
    )
      return res
        .status(200)
        .json({ status: 200, manager_requests, hr_requests, all_notification });
    else return res.status(200).json({ status: 200, log: "No requests found" });
  } catch (e) {
    console.log(e);
    return res.status(400).send(e.message);
  }
};

//Check your sent requests
const GET_YOUR_REQUESTS = async (req: Request, res: Response) => {
  const _id: string = req.params.id;
  if (!_id) {
    return res.status(400).send("Send current user ID");
  }
  try {
    const requests = await leaveRequest.find({ employee_id: _id }).clone();
    if (requests.length > 0)
      return res.status(200).json({ status: 200, requests });
    else return res.status(200).json({ status: 200, log: "No requests found" });
  } catch (e) {
    console.log(e);
    return res.status(400).send(e.message);
  }
};

// might not be required when calender is used, used this function during api testing.
// function used to create date string.
function stringToDate(_date: any, _format: any, _delimiter: any) {
  const formatLowerCase = _format.toLowerCase();
  const formatItems = formatLowerCase.split(_delimiter);
  const dateItems = _date.split(_delimiter);
  const monthIndex = formatItems.indexOf("mm");
  const dayIndex = formatItems.indexOf("dd");
  const yearIndex = formatItems.indexOf("yyyy");
  let month = parseInt(dateItems[monthIndex]);
  month -= 1;
  const formatedDate = new Date(
    dateItems[yearIndex],
    month,
    dateItems[dayIndex]
  );
 // console.log(formatedDate);
  return formatedDate;
}

export {
  CREATE,
  RESOLVE,
  DELETE,
  GETREQUESTS,
  RESOLVE_INDIVIDUAL,
  GET_YOUR_REQUESTS,
};
