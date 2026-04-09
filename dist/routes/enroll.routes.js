"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnrollRoutes = void 0;
const express_1 = __importDefault(require("express"));
const enroll_controller_1 = require("../controllers/enroll.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
router.post("/", enroll_controller_1.enrollControllers.enrollCourse);
router.get("/enrolled", auth_middleware_1.verifyToken, enroll_controller_1.enrollControllers.getMyEnrolledCourses);
exports.EnrollRoutes = router;
