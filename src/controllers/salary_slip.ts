import { Request, Response } from "express";
import Employee from "../models/employee";
import AWS from "aws-sdk";
import fs from "fs";
import path from "path";
import pdf from "html-pdf";
const options = { format: "A4" };
// eslint-disable-next-line @typescript-eslint/no-var-requires
const numWords = require("num-words");

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

const Generate = async (req: Request, res: Response) => {
  try {
    const {
      email,
      basic,
      hra,
      lta,
      misc,
      workingdays,
      Unpaidleave,
      extradays,
      checkbox,
      dat,
    } = req.body;
    // console.log(req.body);
    if (
      !email ||
      !basic ||
      !workingdays ||
      !dat ) {
      res.status(400).send("Please fill all the details");
      return;
    }
    if (
      hra === undefined ||
      lta === undefined ||
      misc === undefined ||
      Unpaidleave === undefined ||
      extradays === undefined
      ) {
      res.send(400).send("Please fill all the details");
      return;
    }

    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const employee: any = await Employee.findOne({ email: email }).select(
      "+bank_details"
    );

    const name = employee.name ? employee.name : "XYZ";
    const A_C: any = employee?.bank_details?.account_number || "NA";
    const bank_name = employee?.bank_details?.bank_name || "NA";
    const total: any = basic + hra + lta + misc;
    const monthly: any = total / 12;
    const date: string = dat + "-04";
    const d = new Date(date); //converts the string into date object
    const month = d.getMonth(); //get the value of month
    const year = d.getFullYear();

    const daysInMonth = new Date(year, (month + 1) % 12, 0).getDate();
    const daily: any = monthly / daysInMonth;
    let total_pay: any = daily * (workingdays - Unpaidleave + extradays);
    total_pay = Math.ceil(total_pay);
    const temp = Date.now();
    //saving salary details for furthur use if checkbox is true
    checkbox &&
      (await Employee.findOneAndUpdate(
        { email },
        { $set: { salary_details: { basic, hra, lta, misc } } },
        { new: true },
        (err, doc) => {
          if (err) {
            // console.log("Something wrong when updating data!");
          }
        }
      ).clone());
    // console.log(total_pay);
    const amountInWords = numWords(total_pay);
    let amountInWord: string = amountInWords + " rupees Only";
    amountInWord = capitalizeFirstLetter(amountInWord);

    const createPDF = (html: any, options: any) =>
      new Promise((resolve, reject) => {
        pdf
          .create(html, options)
          .toFile(
            `./${temp}${monthNames[month]}${year}.pdf`,
            function (err: any, res: any) {
              if (err !== null) {
                reject(err);
              } else {
                resolve(res);
              }
            }
          );
      });

    //salary slip hmtl
    const html = `<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<HTML>
<HEAD>
<META http-equiv="Content-Type" content="text/html; charset=UTF-8">
<TITLE>pdf-html</TITLE>
<META name="generator" content="BCL easyConverter SDK 5.0.252">
<META name="title" content="Pay Slip">
<STYLE type="text/css">
html {zoom:0.75;width:100%;}
body {margin-top: 0px;margin-left: 0px;}

#page_1 {position:relative; overflow: hidden;margin: 98px 0px 333px 96px;padding: 0px;border: none;width: 720px;height: 625px;}

#page_1 #p1dimg1 {position:absolute;top:0px;left:0px;z-index:-1;width:625px;height:625px;}
#page_1 #p1dimg1 #p1img1 {width:625px;height:625px;}




.dclr {clear:both;float:none;height:1px;margin:0px;padding:0px;overflow:hidden;}

.ft0{font: bold 17px 'Calibri';line-height: 21px;}
.ft1{font: 15px 'Calibri';line-height: 18px;}
.ft2{font: 13px 'Arial';line-height: 16px;}
.ft3{font: 1px 'Calibri';line-height: 1px;}
.ft4{font: bold 15px 'Calibri';line-height: 18px;}
.ft5{font: 1px 'Calibri';line-height: 6px;}
.ft6{font: 15px 'Calibri';line-height: 17px;}
.ft7{font: 1px 'Calibri';line-height: 17px;}
.ft8{font: 1px 'Calibri';line-height: 7px;}

.p0{text-align: left;padding-left: 202px;margin-top: 68px;margin-bottom: 0px;}
.p1{text-align: left;padding-left: 7px;margin-top: 0px;margin-bottom: 0px;white-space: nowrap;}
.p2{text-align: left;padding-left: 10px;margin-top: 0px;margin-bottom: 0px;white-space: nowrap;}
.p3{text-align: left;margin-top: 0px;margin-bottom: 0px;white-space: nowrap;}
.p4{text-align: left;padding-left: 4px;margin-top: 0px;margin-bottom: 0px;white-space: nowrap;}
.p5{text-align: right;padding-right: 149px;margin-top: 0px;margin-bottom: 0px;white-space: nowrap;}
.p6{text-align: left;padding-left: 6px;margin-top: 0px;margin-bottom: 0px;white-space: nowrap;}
.p7{text-align: left;padding-left: 7px;margin-top: 30px;margin-bottom: 0px;}
.p8{text-align: left;padding-left: 7px;margin-top: 0px;margin-bottom: 0px;}
.p9{text-align: left;padding-left: 7px;margin-top: 15px;margin-bottom: 0px;}
.p10{text-align: left;padding-left: 7px;margin-top: 35px;margin-bottom: 0px;}

.td0{padding: 0px;margin: 0px;width: 109px;vertical-align: bottom;}
.td1{padding: 0px;margin: 0px;width: 48px;vertical-align: bottom;}
.td2{padding: 0px;margin: 0px;width: 156px;vertical-align: bottom;}
.td3{border-bottom: #000000 1px solid;padding: 0px;margin: 0px;width: 109px;vertical-align: bottom;}
.td4{border-bottom: #000000 1px solid;padding: 0px;margin: 0px;width: 48px;vertical-align: bottom;}
.td5{border-bottom: #000000 1px solid;padding: 0px;margin: 0px;width: 156px;vertical-align: bottom;}
.td6{border-left: #000000 1px solid;padding: 0px;margin: 0px;width: 108px;vertical-align: bottom;}
.td7{border-right: #000000 1px solid;padding: 0px;margin: 0px;width: 47px;vertical-align: bottom;}
.td8{border-right: #000000 1px solid;padding: 0px;margin: 0px;width: 155px;vertical-align: bottom;}
.td9{border-left: #000000 1px solid;border-bottom: #000000 1px solid;padding: 0px;margin: 0px;width: 108px;vertical-align: bottom;}
.td10{border-right: #000000 1px solid;border-bottom: #000000 1px solid;padding: 0px;margin: 0px;width: 47px;vertical-align: bottom;}
.td11{border-right: #000000 1px solid;border-bottom: #000000 1px solid;padding: 0px;margin: 0px;width: 155px;vertical-align: bottom;}

.tr0{height: 22px;}
.tr1{height: 34px;}
.tr2{height: 35px;}
.tr3{height: 30px;}
.tr4{height: 26px;}
.tr5{height: 6px;}
.tr6{height: 17px;}
.tr7{height: 18px;}
.tr8{height: 32px;}
.tr9{height: 7px;}

.t0{width: 625px;margin-top: 25px;font: 15px 'Calibri';}

</STYLE>
</HEAD>

<BODY>
<DIV id="page_1">
<DIV id="p1dimg1">
<IMG src="data:image/png;base64,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AGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGRoKgBkaCoAZGgqAGSsVkqp1WpjvQwAeHYTUwCIqQ0PD9dqteHh4bFeCQA8i9VqNddTASBDUwEgQ1MBIENTASBDUwEgQ1MBIENTASBDUwEgQ1MBIENTASBDUwEgQ1MBIENTASBDUwEgQ1MBIENTASBDUwEgQ1MBIENTASBDUwEgQ1MBIENTASBDUwEgQ1MBIENTASBDUwEgQ1MBIENTASBDUwEgQ1MBIENTASBDUwEgQ1MBIENTASBDUwEgQ1MBIENTASBDUwEgQ1MBIENTASBDUwEgQ1MBIENTASBDUwEgQ1MBIENTASBDUwEgQ1MBAAB4JqkNDw/XarXh4eGxXgkAPIvVajWv/QJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAkCGpgJAhqYCQIamAgAA8Ezy/3779j0HrgY2AAAAAElFTkSuQmCC" id="p1img1"></DIV>


<DIV class="dclr"></DIV>
<P class="p0 ft0">Payslip for the month of ${monthNames[month]}</P>
<TABLE cellpadding=0 cellspacing=0 class="t0">
<TR>
  <TD class="tr0 td0"><P class="p1 ft1">Ref. No.</P></TD>
  <TD class="tr0 td1"><P class="p2 ft2"> 251</P></TD>
  <TD class="tr0 td2"><P class="p3 ft3">&nbsp;</P></TD>
  <TD class="tr0 td2"><P class="p4 ft1">Employee Name</P></TD>
  <TD class="tr0 td2"><P class="p5 ft1"> ${name}</P></TD>
</TR>
<TR>
  <TD class="tr1 td0"><P class="p1 ft1">Pay Days</P></TD>
  <TD class="tr1 td1"><P class="p2 ft1"> ${daysInMonth}</P></TD>
  <TD class="tr1 td2"><P class="p3 ft3">&nbsp;</P></TD>
  <TD class="tr1 td2"><P class="p4 ft1">DOJ</P></TD>
  <TD class="tr1 td2"><P class="p5 ft1"> NA</P></TD>
</TR>
<TR>
  <TD class="tr2 td0"><P class="p1 ft1">Designation</P></TD>
  <TD class="tr2 td1"><P class="p2 ft1"> NA</P></TD>
  <TD class="tr2 td2"><P class="p3 ft3">&nbsp;</P></TD>
  <TD class="tr2 td2"><P class="p4 ft1">A/c No.</P></TD>
  <TD class="tr2 td2"><P class="p5 ft2"> ${A_C}</P></TD>
</TR>
<TR>
  <TD class="tr1 td0"><P class="p1 ft1">EmployeeBank</P></TD>
  <TD class="tr1 td1"><P class="p2 ft1"> ${bank_name}</P></TD>
  <TD class="tr1 td2"><P class="p3 ft3">&nbsp;</P></TD>
  <TD class="tr1 td2"><P class="p4 ft1">PAN No.</P></TD>
  <TD class="tr1 td2"><P class="p5 ft1"> NA</P></TD>
</TR>
<TR>
<TD class="tr1 td0"><P class="p1 ft1">Unpaid Leaves</P></TD>
<TD class="tr1 td1"><P class="p2 ft1"> ${Unpaidleave}</P></TD>
<TD class="tr1 td2"><P class="p3 ft3">&nbsp;</P></TD>
<TD class="tr1 td2"><P class="p4 ft1">Compensation off</P></TD>
<TD class="tr1 td2"><P class="p5 ft1"> ${extradays}</P></TD>
</TR>
<TR>
  <TD class="tr3 td3"><P class="p3 ft3">&nbsp;</P></TD>
  <TD class="tr3 td4"><P class="p3 ft3">&nbsp;</P></TD>
  <TD class="tr3 td5"><P class="p3 ft3">&nbsp;</P></TD>
  <TD class="tr3 td5"><P class="p3 ft3">&nbsp;</P></TD>
  <TD class="tr3 td5"><P class="p3 ft3">&nbsp;</P></TD>
</TR>
<TR>
  <TD class="tr4 td6"><P class="p1 ft4">Earnings</P></TD>
  <TD class="tr4 td7"><P class="p3 ft3">&nbsp;</P></TD>
  <TD class="tr4 td8"><P class="p6 ft4">Amount</P></TD>
  <TD class="tr4 td8"><P class="p6 ft4">Deductions</P></TD>
  <TD class="tr4 td8"><P class="p6 ft4">Amount</P></TD>
</TR>
<TR>
  <TD class="tr5 td9"><P class="p3 ft5">&nbsp;</P></TD>
  <TD class="tr5 td10"><P class="p3 ft5">&nbsp;</P></TD>
  <TD class="tr5 td11"><P class="p3 ft5">&nbsp;</P></TD>
  <TD class="tr5 td11"><P class="p3 ft5">&nbsp;</P></TD>
  <TD class="tr5 td11"><P class="p3 ft5">&nbsp;</P></TD>
</TR>
<TR>
  <TD class="tr4 td6"><P class="p1 ft1">Basic</P></TD>
  <TD class="tr4 td7"><P class="p3 ft3">&nbsp;</P></TD>
  <TD class="tr4 td8"><P class="p6 ft1">&#8377; ${basic}</P></TD>
  <TD class="tr4 td8"><P class="p6 ft1">PF</P></TD>
  <TD class="tr4 td8"><P class="p6 ft1">0</P></TD>
</TR>
<TR>
  <TD class="tr6 td6"><P class="p1 ft6">HRA</P></TD>
  <TD class="tr6 td7"><P class="p3 ft7">&nbsp;</P></TD>
  <TD class="tr6 td8"><P class="p6 ft6">&#8377; ${hra}</P></TD>
  <TD class="tr6 td8"><P class="p6 ft6">TDS</P></TD>
  <TD class="tr6 td8"><P class="p6 ft6">0</P></TD>
</TR>
<TR>
  <TD class="tr7 td6"><P class="p1 ft1">LTA Allowance</P></TD>
  <TD class="tr7 td7"><P class="p3 ft3">&nbsp;</P></TD>
  <TD class="tr7 td8"><P class="p6 ft1">&#8377; ${lta}</P></TD>
  <TD class="tr7 td8"><P class="p3 ft3">&nbsp;</P></TD>
  <TD class="tr7 td8"><P class="p3 ft3">&nbsp;</P></TD>
</TR>
<TR>
  <TD class="tr7 td6"><P class="p1 ft1">Misc Allowance</P></TD>
  <TD class="tr7 td7"><P class="p3 ft3">&nbsp;</P></TD>
  <TD class="tr7 td8"><P class="p6 ft1">&#8377; ${misc}</P></TD>
  <TD class="tr7 td8"><P class="p3 ft3">&nbsp;</P></TD>
  <TD class="tr7 td8"><P class="p3 ft3">&nbsp;</P></TD>
</TR>

<TR>
  <TD class="tr4 td6"><P class="p1 ft4">Total</P></TD>
  <TD class="tr4 td7"><P class="p3 ft3">&nbsp;</P></TD>
  <TD class="tr4 td8"><P class="p6 ft4">&#8377; ${total_pay}</P></TD>
  <TD class="tr4 td8"><P class="p6 ft4">Total</P></TD>
  <TD class="tr4 td8"><P class="p6 ft4">0</P></TD>
</TR>
<TR>
  <TD class="tr9 td9"><P class="p3 ft8">&nbsp;</P></TD>
  <TD class="tr9 td10"><P class="p3 ft8">&nbsp;</P></TD>
  <TD class="tr9 td11"><P class="p3 ft8">&nbsp;</P></TD>
  <TD class="tr9 td11"><P class="p3 ft8">&nbsp;</P></TD>
  <TD class="tr9 td11"><P class="p3 ft8">&nbsp;</P></TD>
</TR>
</TABLE>
<P class="p7 ft4">Net Pay: ${amountInWord}</P>
<P class="p8 ft4">(in words);</P>
<P class="p9 ft4">Signature</P>
<P class="p10 ft4">Apoorva Bhagat</P>
<P class="p8 ft4">HR Manager</P>
</DIV>
</BODY>
</HTML>`;

    //generating pdf
    const PDF = await createPDF(html, options);
    // uploading generated pdf on s3 and sending key to frontend

    const directoryPath = path.join(
      "./",
      `${temp}${monthNames[month]}${year}.pdf`
    );
    const fileContent = fs.readFileSync(directoryPath);
    const params: any = {
      Key: `${temp}${monthNames[month]}${year}.pdf`,
      Body: fileContent,
      Bucket: process.env.AWS_BUCKET,
      ContentType: "application/pdf",
    };

    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_KEY,
      secretAccessKey: process.env.AWS_SECRET,
    });

    s3.upload(params, async (err: any, response: any) => {
      if (err) {
        return res.status(404).json({ log: "Error while uploading salary slip" });
      }
      // console.log(response);
      const key = response.key;
      //deleting generated pdf
      fs.unlinkSync(directoryPath);

      const send_salary_slip = await Employee.findOneAndUpdate(
        { email },
        { $push: { salary_slips: key } },
        { new: true }
      ).clone();
      return res.status(200).json({ key: key });
    });
  } catch (e) {
    return res.status(500).json({ log: e.message });
  }
};
export default Generate;
