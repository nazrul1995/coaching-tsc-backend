import express from 'express';
import { EventRoutes } from './event.route';
// import { AiRoutes } from './ai.routes';
import { UserRoutes } from './user.routes';
import { AiRoutes } from './ai.routes';
import { CourseRoutes } from './course.route';
import { EnrollRoutes } from './enroll.routes';
import { StudentRoutes } from './students.routes';
import { TeacherRoutes } from './teacher.route';


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
    path: '/courses',
    route: CourseRoutes,
  },
  {
    path: "/enroll",
    route: EnrollRoutes,
  },
  {
    path: "/students",
    route: StudentRoutes,
  },
  {
    path: "/teachers",
    route: TeacherRoutes,
  }
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;