import express, { Request, Response } from "express";
import Employee from "../models/employee";

const updateDocument = async (req: Request, res: Response) => {
  if (!req.body.email) {
    //res.status(400).json({ status: '400', log: "email not available"});
    req.body.email = "E16@123.com";
  }
  try {
    //testing
    // return res.status(200).json({ status: '200', log: 'Employee info updated'});
    req.body.files = req.files;
    let documents = [];
    const { files } = req.body;
    // console.log(files);
    if (files.length === 0) {
      return res
        .status(400)
        .json({ log: "Only .png, .jpg ,.jpeg and .pdf format allowed!" });
    }
    if (files.length > 0) {
      documents = files.map((file: any) => {
        return { document_name: "doc", s3_url: file.key };
      });
    }

    Employee.findOneAndUpdate(
      { email: req.body.email },
      { $set: { documents } },
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
export default updateDocument;
