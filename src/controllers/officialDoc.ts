import { Request, Response } from "express";

import officialDoc from "../models/officialDoc";

const OfficialDoc_Upload = async (req: Request, res: Response) => {
  try {
    let doc_name = req.body.doc_name;
    //testing
    if (!doc_name) doc_name = "employee_handbook";
    if (doc_name != "leave_holiday_policy" && doc_name != "employee_handbook") {
      return res.status(400).send("Please send proper doc name ");
    }

    req.body.files = req.files;

    const { files } = req.body;
    if (files.length === 0) {
      return res
        .status(400)
        .json({ log: "Only .png, .jpg ,.jpeg and .pdf format allowed!" });
    }

    const key = files[0]?.key;
    try {
      const doc: any = await officialDoc.find({});
      let _id;
      if (doc.length > 0) {
        _id = doc[0]._id;
      }

      if (doc.length === 0) {
        const official: any = await new officialDoc({
          leave_holiday_policy: "",
        });
        const k = await official.save();
        _id = k._id;
      }
      if (doc_name === "leave_holiday_policy") {
        await officialDoc
          .findOneAndUpdate(
            { _id: _id },
            { $set: { leave_holiday_policy: key } },
            { new: true },
            (err, doc) => {
              if (err) {
                // console.log("Something wrong when updating data!");
              }
            }
          )
          .clone();
        res.status(200).json({ status: "200", log: " Document updated" });
      } else {
        await officialDoc
          .findOneAndUpdate(
            { _id: _id },
            { $set: { employee_handbook: key } },
            { new: true },
            (err, doc) => {
              if (err) {
                // console.log("Something wrong when updating data!");
              }
            }
          )
          .clone();

        res.status(200).json({ status: "200", log: " Document updated" });
      }
    } catch (e) {
      res.status(404).json({ log: "Failed to upload doc on Db" + e.message });
    }
  } catch (e) {
    // console.log(e);
    return res.status(500).json({ log: e.message });
  }
};

const getDocs = async (req: Request, res: Response) => {
  try {
    const docs = await officialDoc.find({});
    if (docs.length > 0) {
      return res.status(200).json({ docs: docs });
    }
    return res.status(404).json({ log: "Nothing to show" });
  } catch (e) {
    res.status(404).json({ log: e.message });
  }
};

//save standard holidays in db
const standardHolidays = async (req: Request, res: Response) => {
  try {
    const standardHoliday = req.body.holidays;
    // console.log(standardHoliday);
    standardHoliday.map(
      (name_date: any) =>
        (name_date.date = stringToDate(name_date.date, "MM/dd/yyyy", "/"))
    );
    // console.log(standardHoliday);
    if (!standardHoliday) {
      res
        .status(400)
        .json({ status: "400", log: "Please fill in all details" });
      return;
    }
    const docs: any = await officialDoc.find({});
    if (docs.length === 0) {
      const official: any = await new officialDoc({
        standard_holidays: standardHoliday,
      });
      const k = await official.save();
      if (k)
        return res
          .status(200)
          .json({ status: "200", log: " Document updated" });
      return res
        .status(400)
        .json({ status: "400", log: " Document updation failed" });
    } else {
      await officialDoc
        .findOneAndUpdate(
          { _id: docs[0]._id },
          {
            $set: {
              standard_holidays: standardHoliday,
            },
          }
        )
        .clone();
      return res.status(200).json({ status: "200", log: " Document updated" });
    }
  } catch (err) {
    return res.status(500).send(err.message);
  }
};
const optionalHolidays = async (req: Request, res: Response) => {
  try {
    const optionalHoliday = req.body.holidays;
    // console.log(optionalHoliday);
    if (!optionalHoliday) {
      res
        .status(400)
        .json({ status: "400", log: "Please fill in all details" });
      return;
    }
    optionalHoliday.map(
      (name_date: any) =>
        (name_date.date = stringToDate(name_date.date, "MM/dd/yyyy", "/"))
    );
    // console.log(optionalHoliday);
    const docs: any = await officialDoc.find({});
    if (docs.length === 0) {
      const official: any = await new officialDoc({
        optional_holidays: optionalHoliday,
      });
      const k = await official.save();
      if (k)
        return res
          .status(200)
          .json({ status: "200", log: " Document updated" });
      return res
        .status(400)
        .json({ status: "400", log: " Document updation failed" });
    } else {
      await officialDoc
        .findOneAndUpdate(
          { _id: docs[0]._id },
          {
            $set: {
              optional_holidays: optionalHoliday,
            },
          }
        )
        .clone();
      return res.status(200).json({ status: "200", log: " Document updated" });
    }
  } catch (err) {
    return res.status(500).send(err.message);
  }
};

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

export { OfficialDoc_Upload, getDocs, standardHolidays, optionalHolidays };
