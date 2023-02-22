import { RequestHandler, Request, Response, NextFunction } from "express";
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();
import open from "open"
const aws = require("aws-sdk");
const multer = require("multer");
const multerS3 = require("multer-s3");
const crypto = require("crypto")
const s3 = new aws.S3({
  accessKeyId: process.env.AWS_KEY,
  secretAccessKey: process.env.AWS_SECRET,
  Bucket: process.env.AWS_BUCKET,
});

const upload: any = multer({
  storage: multerS3({
    s3: s3,
    bucket: process.env.AWS_BUCKET,

    key: function (req: Request, file: any, cb: any) {
      // hashing the filename to be uploaded
      
      cb(null, crypto.createHash("sha256").update(file.originalname).digest("hex"));
    },
    contentType: function (req: Request, file: any, cb: any) {
      cb(null, file.mimetype);
    },
  }),
  fileFilter: function (req: Request, file: any, cb: any) {
    if (
      file.mimetype === "image/jpeg" ||
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpg" ||
      file.mimetype === "application/pdf"
    ) {
      cb(null, true);
    } else {
      req.files = [];
      // return cb(new Error('Only .png, .jpg ,.jpeg and .pdf format allowed!'));
      cb(null, true);
    }
    cb(null, true);
  },
  limits: {
    fileSize: 1024 * 1024 * 10, //10 MB
  },
});

const download: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const fileKey: any = req.query.id;
    if (!fileKey) {
      return res.status(404).json({ log: "please provide document url" });
    }
    // console.log("Trying to download file", fileKey);
    aws.config.update({
      accessKeyId: process.env.AWS_KEY,
      secretAccessKey: process.env.AWS_SECRET,
      Bucket: process.env.AWS_BUCKET,
    });

    const s3 = new aws.S3();
    const options = {
      Bucket: process.env.AWS_BUCKET,
      Key: fileKey,
    };

    try {
      await s3.headObject(options).promise();
      // console.log("File Found in S3");
    } catch (err) {
      return res.status(404).json({ log: "File not found" });
    }

    res.attachment(fileKey);

    const fileStream = s3.getObject(options).createReadStream();
    if (!fileStream) {
      return res.status(404).json({ log: "Doc not found" });
    }

    fileStream.pipe(res);
  } catch (e) {
    // console.error(e);
    return res
      .status(500)
      .json({ status: "500", log: "Server error, try again later!" });
  }
};

//delete user documents from s3 bucket
const deleteDocument: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const fileKey: any = req.query.id;
    if (!fileKey) {
      return res.status(404).json({ log: "Please provide document url" });
    }
    aws.config.update({
      accessKeyId: process.env.AWS_KEY,
      secretAccessKey: process.env.AWS_SECRET,
      Bucket: process.env.AWS_BUCKET,
    });

    const s3 = new aws.S3();
    const options = {
      Bucket: process.env.AWS_BUCKET,
      Key: fileKey,
    };

    try {
      await s3.headObject(options).promise();
      // console.log("File Found in S3");
    } catch (err) {
      return res.status(404).json({ log: "File not found" });
    }

    // console.log("Trying to delete file", fileKey);
    const params = {
      Bucket: process.env.AWS_BUCKET,
      Key: fileKey,
    };
    s3.deleteObject(params, function (err: any, data: any) {
      // if (err) console.log(err, err.stack);
      // an error occurred
      // else console.log(data); // successful response
    });
    return res.status(200).json({ log: "File deleted successfully!" });
  } catch (e) {
    // console.error(e);
    return res
      .status(500)
      .json({ status: "500", log: "Server error, try again later!" });
  }
};

const previewDocument : RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
   // global.window = {document: {createElementNS: () => {return {}} }};
    const fileKey: any = req.query.id;
    if (!fileKey) {
      return res.status(404).json({ log: "Please provide document url" });
    }
    aws.config.update({
      accessKeyId: process.env.AWS_KEY,
      secretAccessKey: process.env.AWS_SECRET,
      Bucket: process.env.AWS_BUCKET,
    });

    const s3 = new aws.S3();

    const url = s3.getSignedUrl('getObject', {
      Bucket:  process.env.AWS_BUCKET,
      Key:fileKey,
      Expires: 86400   //1 day
  });
   if(url)
   {
      open( url);
    return res.status(200).json({previewUrl:url});
   }

  return res.status(400).json({log:"Invalid url generated"});
    
  } catch (e) {
    // console.error(e);
    return res
      .status(500)
      .json({ status: "500", log: "Server error, try again later!" });
  }
};

export { upload, download, deleteDocument,previewDocument };
