import { Request, Response } from 'express';
import { Course } from '../model/courses.model';

// Create course
const createCourse = async (req: Request, res: Response) => {
  try {
    const savedCourse = await Course.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Course created successfully',
      data: savedCourse,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to create course',
      error: err.message,
    });
  }
};

// Get all courses
const getCourses = async (req: Request, res: Response) => {
  try {
    const courses = await Course.find();

    res.status(200).json({
      success: true,
      message: 'Courses fetched successfully',
      data: courses,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
      error: err.message,
    });
  }
};

// Get single course
const getCourseById = async (req: Request, res: Response) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Course fetched successfully',
      data: course,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch course',
      error: err.message,
    });
  }
};

// Update course
const updateCourse = async (req: Request, res: Response) => {
  try {
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedCourse) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: updatedCourse,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update course',
      error: err.message,
    });
  }
};
const updateCourseRating = async (req: Request, res: Response) => {
  try {
    const updatedCourseRating = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedCourseRating) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Course updated successfully',
      data: updatedCourseRating,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to update course Rating',
      error: err.message,
    });
  }
};


// Delete course
const deleteCourse = async (req: Request, res: Response) => {
  try {
    const deletedCourse = await Course.findByIdAndDelete(req.params.id);

    if (!deletedCourse) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Course deleted successfully',
      data: null,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete course',
      error: err.message,
    });
  }
};

export const courseControllers = {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  updateCourseRating
};