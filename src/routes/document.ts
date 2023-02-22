import { Router, Request, Response, NextFunction } from "express";
const router = Router();
import { upload, download, deleteDocument,previewDocument } from "../middleware/document";
import updateDocument from "../controllers/document";
import {
  OfficialDoc_Upload,
  getDocs,
  standardHolidays,
  optionalHolidays,
} from "../controllers/officialDoc";
import { isAdmin,privateRoute } from "../middleware/auth";

const fileSizeLimitErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err) {
    res.status(413).json({ log: "file size should be <= 10MB", error: err });
  } else {
    next();
  }
};

router.post(
  "/uploadDocuments",
  upload.array("documents"),
  fileSizeLimitErrorHandler,
  updateDocument
);
router.get("/download",privateRoute, download);
router.delete("/deleteDoc", deleteDocument);

router.post(
  "/uploadOfficial",
  isAdmin,
  upload.array("documents"),
  fileSizeLimitErrorHandler,
  OfficialDoc_Upload
);
router.get("/companyPolicies", getDocs);
router.post("/standardholidays", isAdmin, standardHolidays);
router.post("/optionalholidays", isAdmin, optionalHolidays);
router.get("/previewDoc",privateRoute,previewDocument);

export default router;
