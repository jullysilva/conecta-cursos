import type { Role, VideoProvider } from './models';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  active: boolean;
  createdAt: string;
}

export interface AdminUserDetail extends AdminUser {
  enrollments: { lastAccessedAt: string; course: { id: string; title: string } }[];
}

export interface UserPayload {
  name: string;
  email: string;
  role: Role;
  active: boolean;
  password?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  position: number;
  _count?: { courses: number };
}

export interface AdminCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnailUrl: string | null;
  workloadHours: number;
  published: boolean;
  featured: boolean;
  categoryId: string | null;
  updatedAt: string;
  category?: { id: string; name: string } | null;
  _count?: { modules: number; enrollments: number };
}

export interface AdminLesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  videoProvider: VideoProvider;
  videoRef: string;
  durationSec: number;
  materialUrl: string | null;
  position: number;
}

export interface AdminModule {
  id: string;
  courseId: string;
  title: string;
  position: number;
  lessons: AdminLesson[];
}

export interface AdminCourseDetail extends AdminCourse {
  modules: AdminModule[];
}

export type CoursePayload = Partial<
  Pick<AdminCourse, 'title' | 'description' | 'thumbnailUrl' | 'workloadHours' | 'published' | 'featured' | 'categoryId'>
>;

export type LessonPayload = Partial<Omit<AdminLesson, 'id' | 'position'>>;

export interface AdminLearningPath {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  published: boolean;
  position: number;
  courseIds: string[];
}

export interface AdminBanner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string | null;
  position: number;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
}

export interface CourseOption {
  id: string;
  title: string;
  published: boolean;
}

export interface Dashboard {
  students: number;
  admins: number;
  courses: number;
  publishedCourses: number;
  lessons: number;
  completionsLast30Days: number;
  activeStudentsLast30Days: number;
  topCourses: { id: string; title: string; enrollments: number }[];
}
