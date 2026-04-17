"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResultRoutes = void 0;
const express_1 = __importDefault(require("express"));
const result_controller_1 = require("../controllers/result.controller");
const router = express_1.default.Router();
router.post('/', result_controller_1.studentResultControllers.createResult);
router.get('/', result_controller_1.studentResultControllers.getResults);
// specific route FIRST
router.get('/student/:studentId', result_controller_1.studentResultControllers.getResultsByStudent);
// then dynamic id
router.get('/:id', result_controller_1.studentResultControllers.getResultById);
router.patch('/:id', result_controller_1.studentResultControllers.updateResult);
router.delete('/:id', result_controller_1.studentResultControllers.deleteResult);
exports.ResultRoutes = router;
