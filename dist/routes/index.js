"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const event_route_1 = require("./event.route");
// import { AiRoutes } from './ai.routes';
const user_routes_1 = require("./user.routes");
const ai_routes_1 = require("./ai.routes");
const course_route_1 = require("./course.route");
const enroll_routes_1 = require("./enroll.routes");
const router = express_1.default.Router();
const moduleRoutes = [
    {
        path: '/events',
        route: event_route_1.EventRoutes,
    },
    {
        path: '/users',
        route: user_routes_1.UserRoutes,
    },
    {
        path: '/ai',
        route: ai_routes_1.AiRoutes,
    },
    {
        path: '/courses',
        route: course_route_1.CourseRoutes,
    },
    {
        path: "/enroll",
        route: enroll_routes_1.EnrollRoutes,
    }
];
moduleRoutes.forEach((route) => router.use(route.path, route.route));
exports.default = router;
