import express from "express";
import { studentResultControllers } from "../controllers/result.controller";

const router = express.Router();

router.post('/', studentResultControllers.createResult);

router.get('/', studentResultControllers.getResults);

// specific route FIRST
router.get('/student/:studentId', studentResultControllers.getResultsByStudent);

// then dynamic id
router.get('/:id', studentResultControllers.getResultById);

router.patch('/:id', studentResultControllers.updateResult);
router.delete('/:id', studentResultControllers.deleteResult);
export const ResultRoutes = router;