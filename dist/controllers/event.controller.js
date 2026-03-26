"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventControllers = void 0;
const event_model_1 = require("../model/event.model");
// Create event
const createEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const savedEvent = yield event_model_1.Event.create(req.body);
        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            data: savedEvent,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to create event',
            error: err.message,
        });
    }
});
// Get all events
const getEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const events = yield event_model_1.Event.find();
        res.status(200).json({
            success: true,
            message: 'Events fetched successfully',
            data: events,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch events',
            error: err.message,
        });
    }
});
// Get single event
const getEventById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const event = yield event_model_1.Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Event fetched successfully',
            data: event,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to fetch event',
            error: err.message,
        });
    }
});
// Update event
const updateEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const updatedEvent = yield event_model_1.Event.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedEvent) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Event updated successfully',
            data: updatedEvent,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to update event',
            error: err.message,
        });
    }
});
// Delete event
const deleteEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const deletedEvent = yield event_model_1.Event.findByIdAndDelete(req.params.id);
        if (!deletedEvent) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
            });
        }
        res.status(200).json({
            success: true,
            message: 'Event deleted successfully',
            data: null,
        });
    }
    catch (err) {
        res.status(500).json({
            success: false,
            message: 'Failed to delete event',
            error: err.message,
        });
    }
});
exports.eventControllers = {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent,
};
