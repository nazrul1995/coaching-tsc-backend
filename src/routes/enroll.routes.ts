import express from "express";
import { enrollControllers } from "../controllers/enroll.controller";
import { verifyToken } from "../middleware/auth.middleware";
const router = express.Router();

router.post("/", enrollControllers.enrollCourse);

router.get("/enrolled",verifyToken, enrollControllers.getMyEnrolledCourses);
export const EnrollRoutes = router;