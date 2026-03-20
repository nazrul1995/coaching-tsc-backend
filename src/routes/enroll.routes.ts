import express from "express";
import { enrollControllers } from "../controllers/enroll.controller";
const router = express.Router();

router.post("/", enrollControllers.enrollCourse);

export const EnrollRoutes = router;