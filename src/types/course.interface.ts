export interface TCourse {
  _id: string;
  title: string;
  description: string;
  price: number;
  duration: string;
  teacher: string;
  thumbnail: string;
  enrolledStudents: number;
  rating: number;
  totalModules: number,
}