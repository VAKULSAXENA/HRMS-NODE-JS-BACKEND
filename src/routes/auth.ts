import { Router } from "express";
import { isAdmin, isAuthenticated } from "../middleware/auth";
import {
  login,
  register,
  getEmployees,
  updateRole,
  logout,
  getEmployee,
  currentEmployee,
  verify,
  changePassword,
  manager,
  admin,
  UploadPersonalDetails,
} from "../controllers/auth";
const router = Router();

router.post("/login", login);
router.post("/register", register);
router.get('/getEmployees', isAuthenticated, getEmployees);
router.post("/updateRole", updateRole);
router.get("/currentEmployee", isAuthenticated, currentEmployee);
router.get('/employee/:_id', isAuthenticated, getEmployee)
router.delete("/logout", logout);
router.post("/verify", verify);
router.post("/changePassword", changePassword);
router.post("/assignManager", isAdmin, manager);
router.post("/changeAdmin", isAdmin, admin);
router.post("/uploadPeronsalDetails", UploadPersonalDetails);

export default router;
