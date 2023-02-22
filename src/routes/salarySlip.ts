import { Router } from "express";
import Generate from "../controllers/salary_slip";
const router = Router();

router.post("/generateSalarySlip", Generate);
export default router;
