import { Request, Response } from "express";
import { Course } from "../model/courses.model";
import { EnrollCourse } from "../model/enrollcourse.model";

const enrollCourse = async (req: Request, res: Response) => {
  try {
    const { userEmail, userName, courseId } = req.body;

    // 1. Check course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // 2. Prevent duplicate enrollment
    const alreadyEnrolled = await EnrollCourse.findOne({
      userEmail,
      courseId,
    });

    if (alreadyEnrolled) {
      return res.status(400).json({
        success: false,
        message: "You already enrolled in this course",
      });
    }

    // 3. Create enrollment
    const enrollment = await EnrollCourse.create({
      userEmail,
      userName,
      courseId,
      courseTitle: course.title,
      price: course.price,
      creatorEmail: course.creatorEmail,
    });

    // 4. Update enrolledStudents count
    await Course.findByIdAndUpdate(courseId, {
      $inc: { enrolledStudents: 1 },
    });

    res.status(201).json({
      success: true,
      message: "Course enrolled successfully",
      data: enrollment,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Enrollment failed",
      error: error.message,
    });
  }
};

const getMyEnrolledCourses = async (req: Request, res: Response) => {
  try {
    const userEmail = req.query.userEmail as string;
    if (!userEmail) {
      return res.status(400).json({ success: false, message: "User email is required" });
    }
    const enrollments = await EnrollCourse.find({ userEmail });

    res.status(200).json({
      success: true,
      message: "Enrolled courses retrieved successfully",
      data: enrollments,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve enrolled courses",
      error: error.message,
    });
  }
};

export const enrollControllers = {
  enrollCourse,
  getMyEnrolledCourses,
};