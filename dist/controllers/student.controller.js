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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentControllers = exports.deleteStudent = exports.updateStudent = exports.getStudentDetails = exports.getStudentByemail = exports.getAllStudents = exports.createStudent = exports.createStudentByAdmin = void 0;
const student_model_1 = require("../model/student.model");
const user_model_1 = require("../model/user.model");
const payment_model_1 = require("../model/payment.model");
const mongoose_1 = __importDefault(require("mongoose"));
const examResult_model_1 = require("../model/examResult.model");
// Helper to catch async errors
const catchAsync = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.createStudentByAdmin = catchAsync((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password, phone, className, batch, group, photo, institution, guradianName, monthlyFee, admissionDate, } = req.body;
    // ==========================
    // 1. Validate required fields
    // ==========================
    if (!name ||
        !email ||
        !password ||
        !phone ||
        !className ||
        !institution ||
        !guradianName ||
        monthlyFee === undefined) {
        return res.status(400).json({
            success: false,
            message: "Name, email, password, phone, className, institution, guardian name and monthly fee are required",
        });
    }
    const fee = Number(monthlyFee);
    if (!Number.isFinite(fee) || fee < 0) {
        return res.status(400).json({
            success: false,
            message: "Monthly fee must be a valid positive number",
        });
    }
    // admissionDate সঠিক ফরম্যাটে হ্যান্ডেল করা
    const parsedAdmissionDate = admissionDate
        ? new Date(admissionDate)
        : new Date();
    if (isNaN(parsedAdmissionDate.getTime())) {
        return res.status(400).json({
            success: false,
            message: "Invalid admission date provided",
        });
    }
    // ==========================
    // 2. Check Existing Records
    // ==========================
    const existingStudent = yield student_model_1.Student.findOne({ email });
    if (existingStudent) {
        return res.status(400).json({
            success: false,
            message: "Student already exists with this email",
        });
    }
    const existingUser = yield user_model_1.User.findOne({ email });
    if (existingUser) {
        return res.status(400).json({
            success: false,
            message: "A user already exists with this email",
        });
    }
    // ==========================
    // 3. Create User, Student & Initial Fee using Transaction
    // ==========================
    const session = yield mongoose_1.default.startSession();
    session.startTransaction();
    try {
        // Create User
        const [newUser] = yield user_model_1.User.create([
            {
                name,
                email,
                password,
                role: "student",
                image: photo,
            },
        ], { session });
        console.log("New User", newUser);
        // Create Student
        const [newStudent] = yield student_model_1.Student.create([
            {
                name,
                userId: newUser._id,
                email,
                phone,
                className,
                guradianName,
                batch,
                group,
                photo,
                institution,
                monthlyFee: fee,
                admissionDate: parsedAdmissionDate,
            },
        ], { session });
        console.log(newStudent);
        // ==========================
        // 4. Generate First Cycle Fee Automatically
        // ==========================
        const cycleStartDate = new Date(parsedAdmissionDate);
        const cycleEndDate = new Date(cycleStartDate);
        cycleEndDate.setMonth(cycleEndDate.getMonth() + 1);
        const dueDate = new Date(cycleEndDate);
        dueDate.setDate(dueDate.getDate() + 7); // গ্রেস পিরিয়ডসহ Due Date (৭ দিন)
        const initialFee = yield new payment_model_1.StudentFee({
            student: newStudent._id,
            cycleStartDate,
            cycleEndDate,
            dueDate,
            amount: fee,
            paidAmount: 0,
            status: "unpaid",
        }).save({ session });
        // Transaction সফল হলে Commit করা
        yield session.commitTransaction();
        session.endSession();
        return res.status(201).json({
            success: true,
            message: "Student, User account, and initial Fee record created successfully",
            student: newStudent,
            initialFee,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                image: newUser.image,
            },
        });
    }
    catch (error) {
        // কোনো একটি স্টেপে ভুল হলে পুরো ট্রানজেকশন অটো রোলব্যাক হয়ে যাবে
        yield session.abortTransaction();
        session.endSession();
        throw error;
    }
}));
// CREATE STUDENT
exports.createStudent = catchAsync((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, phone, className, batch, group, photo, institution, guradianName } = req.body;
    if (!name || !email || !phone || !className || !guradianName) {
        return res.status(400).json({
            success: false,
            message: "Name, email, phone, className, and guardian name are required",
        });
    }
    const existingStudent = yield student_model_1.Student.findOne({ email });
    if (existingStudent) {
        return res.status(400).json({
            success: false,
            message: "Student already exists with this email",
        });
    }
    const newStudent = yield student_model_1.Student.create({
        name,
        email,
        phone,
        className,
        guradianName,
        batch,
        group,
        photo,
        institution,
    });
    const updatedUser = yield user_model_1.User.findOneAndUpdate({ email }, { role: "student" }, { new: true });
    res.status(201).json({
        success: true,
        message: "Student created successfully and user role updated",
        student: newStudent,
        user: updatedUser,
    });
}));
// GET ALL STUDENTS (OPTIONAL FILTER BY CLASS)
exports.getAllStudents = catchAsync((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const className = req.query.class;
    // build filter dynamically
    const filter = {};
    if (className) {
        filter.className = className;
    }
    const students = yield student_model_1.Student.find(filter).sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        message: 'Students retrieved successfully',
        data: students, // ✅ better API structure
    });
}));
// GET STUDENT BY EMAIL
exports.getStudentByemail = catchAsync((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const student = yield student_model_1.Student.findOne({ email: req.params.email });
    if (!student) {
        return res.status(404).json({
            success: false,
            message: "Student not found",
        });
    }
    res.status(200).json({
        success: true,
        message: "Student retrieved successfully",
        student,
    });
}));
// ======================================================
// GET STUDENT DETAILS
// ======================================================
exports.getStudentDetails = catchAsync((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // ==================================================
    // 0. GET EMAIL FROM QUERY PARAMETER
    // ==================================================
    const { email } = req.query;
    if (!email || typeof email !== "string") {
        return res.status(400).json({
            success: false,
            message: "Email is required",
        });
    }
    const studentEmail = email.trim().toLowerCase();
    // ==================================================
    // 1. STUDENT
    // ==================================================
    const student = yield student_model_1.Student.findOne({
        email: studentEmail,
        isDeleted: { $ne: true },
    }).lean();
    if (!student) {
        return res.status(404).json({
            success: false,
            message: "Student not found",
        });
    }
    // Student's actual MongoDB ObjectId
    const studentId = student._id;
    // ==================================================
    // 2. STUDENT'S EXAM RESULTS
    // ==================================================
    const results = yield examResult_model_1.ExamResult.find({
        student: studentId,
        status: "published",
    })
        .populate("exam", "title type examDate totalMarks className batch group")
        .sort({ createdAt: -1 })
        .lean();
    // ==================================================
    // 3. ACADEMIC STATISTICS
    // ==================================================
    const participatedResults = results.filter((result) => !result.isAbsent);
    const absentResults = results.filter((result) => result.isAbsent);
    const percentages = participatedResults.map((result) => result.percentage);
    const averagePercentage = percentages.length > 0
        ? percentages.reduce((sum, value) => sum + value, 0) / percentages.length
        : 0;
    const highestPercentage = percentages.length > 0
        ? Math.max(...percentages)
        : 0;
    const lowestPercentage = percentages.length > 0
        ? Math.min(...percentages)
        : 0;
    const totalObtainedMarks = participatedResults.reduce((sum, result) => sum + result.marks, 0);
    // Weekly exam count
    const weeklyExamCount = results.filter((result) => { var _a; return ((_a = result.exam) === null || _a === void 0 ? void 0 : _a.type) === "weekly"; }).length;
    // Model test count
    const modelTestCount = results.filter((result) => { var _a; return ((_a = result.exam) === null || _a === void 0 ? void 0 : _a.type) === "model_test"; }).length;
    // ==================================================
    // 4. FEE HISTORY
    // ==================================================
    const fees = yield payment_model_1.StudentFee.find({
        student: studentId,
    })
        .sort({ cycleStartDate: -1 })
        .lean();
    // ==================================================
    // 5. FEE STATISTICS
    // ==================================================
    const totalFeeAmount = fees.reduce((sum, fee) => sum + fee.amount, 0);
    const totalPaidAmount = fees.reduce((sum, fee) => sum + fee.paidAmount, 0);
    const totalOutstanding = Math.max(0, totalFeeAmount - totalPaidAmount);
    const paidCycles = fees.filter((fee) => fee.status === "paid").length;
    const partialCycles = fees.filter((fee) => fee.status === "partial").length;
    const overdueCycles = fees.filter((fee) => fee.status === "overdue").length;
    const unpaidCycles = fees.filter((fee) => fee.status === "unpaid").length;
    // ==================================================
    // 6. ALL STUDENTS
    // ==================================================
    const allStudents = yield student_model_1.Student.find({
        isDeleted: { $ne: true },
    })
        .select("_id className batch group")
        .lean();
    // ==================================================
    // 7. ALL STUDENTS' ACADEMIC AVERAGE
    // ==================================================
    const rankingData = yield examResult_model_1.ExamResult.aggregate([
        {
            $match: {
                status: "published",
                isAbsent: false,
            },
        },
        {
            $group: {
                _id: "$student",
                averagePercentage: {
                    $avg: "$percentage",
                },
                totalExams: {
                    $sum: 1,
                },
                totalObtainedMarks: {
                    $sum: "$marks",
                },
            },
        },
        {
            $sort: {
                averagePercentage: -1,
                totalObtainedMarks: -1,
            },
        },
    ]);
    // ==================================================
    // 8. RANKING MAP
    // ==================================================
    const rankingMap = new Map();
    rankingData.forEach((item) => {
        rankingMap.set(item._id.toString(), {
            averagePercentage: item.averagePercentage,
            totalExams: item.totalExams,
            totalObtainedMarks: item.totalObtainedMarks,
        });
    });
    // ==================================================
    // 9. RANK CALCULATOR
    // ==================================================
    const calculateRanking = (students) => {
        const rankedStudents = students
            .map((student) => {
            const academic = rankingMap.get(student._id.toString());
            if (!academic) {
                return null;
            }
            return {
                studentId: student._id.toString(),
                averagePercentage: academic.averagePercentage,
                totalExams: academic.totalExams,
                totalObtainedMarks: academic.totalObtainedMarks,
            };
        })
            .filter(Boolean);
        // Highest average first
        rankedStudents.sort((a, b) => {
            if (b.averagePercentage !==
                a.averagePercentage) {
                return (b.averagePercentage -
                    a.averagePercentage);
            }
            // Same average হলে বেশি obtained marks আগে
            return (b.totalObtainedMarks -
                a.totalObtainedMarks);
        });
        // Find current student
        const currentStudent = rankedStudents.find((item) => item.studentId ===
            studentId.toString());
        let rank = null;
        if (currentStudent) {
            rank =
                rankedStudents.filter((item) => item.averagePercentage >
                    currentStudent.averagePercentage).length + 1;
        }
        return {
            rank,
            // Total enrolled students
            totalStudents: students.length,
            // Students who have published results
            rankedStudents: rankedStudents.length,
            averagePercentage: currentStudent
                ? Number(currentStudent.averagePercentage.toFixed(2))
                : 0,
        };
    };
    // ==================================================
    // 10. BATCH STUDENTS
    // ==================================================
    const batchStudents = allStudents.filter((item) => item.batch === student.batch);
    const batchRanking = calculateRanking(batchStudents);
    // ==================================================
    // 11. CLASS STUDENTS
    // ==================================================
    const classStudents = allStudents.filter((item) => item.className === student.className);
    const classRanking = calculateRanking(classStudents);
    // ==================================================
    // 12. EXACT GROUP / BATCH / CLASS RANK
    // ==================================================
    const groupStudents = allStudents.filter((item) => item.className ===
        student.className &&
        item.batch === student.batch &&
        item.group === student.group);
    const groupRanking = calculateRanking(groupStudents);
    // ==================================================
    // 13. WHOLE COACHING RANK
    // ==================================================
    const coachingRanking = calculateRanking(allStudents);
    // ==================================================
    // 14. STUDENT'S OWN ACADEMIC RANKING DATA
    // ==================================================
    const ownRankingData = rankingMap.get(studentId.toString());
    // ==================================================
    // 15. FINAL RESPONSE
    // ==================================================
    return res.status(200).json({
        success: true,
        data: {
            // ==================================================
            // STUDENT
            // ==================================================
            student: {
                _id: student._id,
                name: student.name,
                email: student.email,
                guradianName: student.guradianName,
                phone: student.phone,
                institution: student.institution,
                className: student.className,
                batch: student.batch,
                group: student.group,
                admissionDate: student.admissionDate,
                photo: student.photo,
                monthlyFee: student.monthlyFee,
            },
            // ==================================================
            // ACADEMIC SUMMARY
            // ==================================================
            academicSummary: {
                totalExams: results.length,
                participated: participatedResults.length,
                absent: absentResults.length,
                totalObtainedMarks,
                averagePercentage: Number(averagePercentage.toFixed(2)),
                highestPercentage: Number(highestPercentage.toFixed(2)),
                lowestPercentage: Number(lowestPercentage.toFixed(2)),
                weeklyExamCount,
                modelTestCount,
            },
            // ==================================================
            // RANKING
            // ==================================================
            ranking: {
                // ----------------------------------------------
                // Exact Group
                // Class + Batch + Group
                // ----------------------------------------------
                group: {
                    rank: groupRanking.rank,
                    totalStudents: groupRanking.totalStudents,
                    rankedStudents: groupRanking.rankedStudents,
                    averagePercentage: groupRanking.averagePercentage,
                },
                // ----------------------------------------------
                // Batch
                // ----------------------------------------------
                batch: {
                    rank: batchRanking.rank,
                    totalStudents: batchRanking.totalStudents,
                    rankedStudents: batchRanking.rankedStudents,
                    averagePercentage: batchRanking.averagePercentage,
                },
                // ----------------------------------------------
                // Class
                // ----------------------------------------------
                class: {
                    rank: classRanking.rank,
                    totalStudents: classRanking.totalStudents,
                    rankedStudents: classRanking.rankedStudents,
                    averagePercentage: classRanking.averagePercentage,
                },
                // ----------------------------------------------
                // Whole Coaching
                // ----------------------------------------------
                coaching: {
                    rank: coachingRanking.rank,
                    totalStudents: coachingRanking.totalStudents,
                    rankedStudents: coachingRanking.rankedStudents,
                    averagePercentage: coachingRanking.averagePercentage,
                },
                // ----------------------------------------------
                // Student has result or not
                // ----------------------------------------------
                hasRanking: !!ownRankingData,
            },
            // ==================================================
            // FEE SUMMARY
            // ==================================================
            feeSummary: {
                monthlyFee: student.monthlyFee || 0,
                totalFeeAmount,
                totalPaidAmount,
                totalOutstanding,
                paidCycles,
                partialCycles,
                overdueCycles,
                unpaidCycles,
            },
            // ==================================================
            // EXAM RESULTS
            // ==================================================
            results,
            // ==================================================
            // FEE HISTORY
            // ==================================================
            feeHistory: fees,
        },
    });
}));
// UPDATE STUDENT
exports.updateStudent = catchAsync((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, phone, className, batch, group, photoUrl } = req.body;
    console.log(name, email, phone, className, batch, group, photoUrl);
    const updatedStudent = yield student_model_1.Student.findByIdAndUpdate(req.params.id, { name, email, phone, className, batch, group, photo: photoUrl }, { new: true, runValidators: true });
    if (!updatedStudent) {
        return res.status(404).json({
            success: false,
            message: "Student not found",
        });
    }
    const updatedUser = yield user_model_1.User.findOneAndUpdate({ email: updatedStudent.email }, // or req.body.email
    {
        name,
    }, { new: true, runValidators: true });
    return res.status(200).json({
        success: true,
        message: "Student updated successfully",
        student: updatedStudent,
        user: updatedUser,
    });
}));
// DELETE STUDENT
exports.deleteStudent = catchAsync((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const student = yield student_model_1.Student.findByIdAndDelete(req.params.id);
    if (!student) {
        return res.status(404).json({
            success: false,
            message: "Student not found",
        });
    }
    yield user_model_1.User.deleteOne({ email: student.email });
    res.status(200).json({
        success: true,
        message: "Student deleted successfully and user role reset",
    });
}));
// Export controllers
exports.studentControllers = {
    createStudent: exports.createStudent,
    getAllStudents: exports.getAllStudents,
    getStudentByemail: exports.getStudentByemail,
    getStudentDetails: exports.getStudentDetails,
    updateStudent: exports.updateStudent,
    deleteStudent: exports.deleteStudent,
    createStudentByAdmin: exports.createStudentByAdmin,
};
