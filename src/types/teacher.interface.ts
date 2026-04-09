export interface TTeacher {
  // Basic Info
  name: string;
  email: string;
  phone: string;
  photo: string;

  // Professional Info
  bio: string;               // Short introduction
  qualification: string;     // e.g., "MSc in Physics"
  experience: string;        // e.g., "5 years teaching experience"
  subjects: string[];        // Subjects teacher handles
   teachingLevel?: string[];     // e.g., "High School", "College", "Middle School"

  // Social / Contact Links
  linkedin?: string;
  facebook?: string;
  twitter?: string;
  website?: string;

  // Ratings / Reviews
  rating?: number;           // Average rating (1-5)
  reviewsCount?: number;     // Number of reviews received

  // Optional meta
  status?: "active" | "inactive"; // Account status
}