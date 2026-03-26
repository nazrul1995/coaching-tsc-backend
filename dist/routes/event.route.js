"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventRoutes = void 0;
const express_1 = __importDefault(require("express"));
const event_controller_1 = require("../controllers/event.controller");
const router = express_1.default.Router();
// Get all events
router.get('/', event_controller_1.eventControllers.getEvents);
// Get single event
router.get('/:id', event_controller_1.eventControllers.getEventById);
// Create event
router.post('/', event_controller_1.eventControllers.createEvent);
// Update event
router.put('/:id', event_controller_1.eventControllers.updateEvent);
// Delete event
router.delete('/:id', event_controller_1.eventControllers.deleteEvent);
exports.EventRoutes = router;
