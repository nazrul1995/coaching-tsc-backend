import express from 'express';
import { EventRoutes } from './event.route';
// import { AiRoutes } from './ai.routes';
import { UserRoutes } from './user.routes';
import { AiRoutes } from './ai.routes';
import path from 'node:path';
import { CourseRoutes } from './course.route';
import { EnrollRoutes } from './enroll.routes';


const router = express.Router();

const moduleRoutes = [
  {
    path: '/events',
    route: EventRoutes,
  },
  {
    path: '/users',
    route: UserRoutes,  
  },
  {
    path: '/ai',
    route: AiRoutes,
  },
  {
    path: '/course',
    route: CourseRoutes,
  },
  {
  path: "/enroll",
  route: EnrollRoutes,
}
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;