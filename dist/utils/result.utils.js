"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateGrade = void 0;
const calculateGrade = (percentage) => {
    if (percentage >= 80)
        return "A+";
    if (percentage >= 70)
        return "A";
    if (percentage >= 60)
        return "A-";
    if (percentage >= 50)
        return "B";
    if (percentage >= 40)
        return "C";
    if (percentage >= 33)
        return "D";
    return "F";
};
exports.calculateGrade = calculateGrade;
