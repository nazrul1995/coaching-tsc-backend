export interface TEnrollCourse {
  userEmail: string;
  userName: string;
  courseId: string;
  courseTitle: string;
  price: number;
  enrolledAt?: Date;
  status: string;
  creatorEmail?: string;
}