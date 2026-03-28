import { Request, Response } from 'express';
import { Course } from '../model/courses.model';
import { AuthRequest } from '../middleware/auth.middleware';

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
    const {
      limit = '3',
      page = '3',
      sort = 'price',
      order = 'desc',
      search = '',
      rating,
      priceMin,
      priceMax,
    } = req.query;

    const limitNum = Math.max(1, Number(limit));
    const pageNum = Math.max(1, Number(page));
    const skip = (pageNum - 1) * limitNum;

    // 🔍 Query object
    const query: Record<string, any> = {};

    // Search
    if (search) {
      query.title = { $regex: String(search), $options: 'i' };
    }

    // ⭐ Rating filter
    if (rating) {
      query.rating = { $gte: Number(rating) };
    }

    // 💰 Price filter
    if (priceMin || priceMax) {
      query.price = {};
      if (priceMin) query.price.$gte = Number(priceMin);
      if (priceMax) query.price.$lte = Number(priceMax);
    }

    // 🔃 Sorting
    const sortOption: Record<string, 1 | -1> = {};
    sortOption[String(sort)] = order === 'asc' ? 1 : -1;

    const courses = await Course.find(query)
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum);

    const total = await Course.countDocuments(query);

    res.status(200).json({
      success: true,
      data: courses,
      meta: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPage: Math.ceil(total / limitNum),
      },
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
// Get  course by email
const getMyCourses = async (req: AuthRequest, res: Response) => {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(400).json({ success: false, message: "User email missing" });
    }

    console.log("Fetching courses for email:", userEmail);

    const courses = await Course.find({ creatorEmail: userEmail }); // 🔹 updated field
    res.status(200).json({
      success: true,
      message: "Courses fetched successfully",
      data: courses,
    });
  } catch (err: any) {
    console.error("Failed to fetch courses:", err);
    res.status(500).json({
      success: false,
      message: "Failed to fetch courses",
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
  updateCourseRating,
  getMyCourses,
};