import { Router } from "express";
import { isAdmin } from "../middleware/auth";
import {
  CREATE,
  RESOLVE,
  DELETE,
  GETREQUESTS,
  RESOLVE_INDIVIDUAL,
  GET_YOUR_REQUESTS,
} from "../controllers/requests";
const router = Router();

router.post("/leave", CREATE);
router.post("/resolve", isAdmin, RESOLVE);
router.post("/delete", DELETE);
router.get("/getRequests/:id", GETREQUESTS);
router.post("/resolveIndividual", RESOLVE_INDIVIDUAL);
router.get("/myRequests/:id", GET_YOUR_REQUESTS);

export default router;
