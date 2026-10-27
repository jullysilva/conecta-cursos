import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type {
  Banner,
  CategoryShelf,
  CourseCard,
  CourseDetail,
  LearningPathDetail,
  LearningPathSummary,
  LessonDetail,
  StudentSummary,
} from '../models/models';
import { AuthService } from '../auth/auth.service';

/** Student-facing API: portal content, courses, lessons and progress. */
@Injectable({ providedIn: 'root' })
export class LearningService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  banners() {
    return this.http.get<Banner[]>('/api/portal/banners');
  }

  categories() {
    return this.http.get<CategoryShelf[]>('/api/portal/categories');
  }

  featuredCourse() {
    return this.http.get<CourseCard | null>('/api/portal/featured-course');
  }

  learningPaths() {
    return this.http.get<LearningPathSummary[]>('/api/portal/learning-paths');
  }

  learningPath(id: string) {
    return this.http.get<LearningPathDetail>(`/api/student/learning-paths/${id}`);
  }

  summary() {
    return this.http.get<StudentSummary>('/api/student/summary');
  }

  course(id: string) {
    return this.http.get<CourseDetail>(`/api/student/courses/${id}`);
  }

  lesson(id: string) {
    return this.http.get<LessonDetail>(`/api/student/lessons/${id}`);
  }

  saveProgress(lessonId: string, positionSec: number, completed?: boolean) {
    return this.http.put<{ positionSec: number; completed: boolean }>(
      `/api/student/lessons/${lessonId}/progress`,
      { positionSec: Math.floor(positionSec), ...(completed !== undefined && { completed }) },
    );
  }

  /** Fire-and-forget save used when the page is being closed. */
  saveProgressOnExit(lessonId: string, positionSec: number): void {
    const token = this.auth.accessToken();
    if (!token || typeof navigator.sendBeacon !== 'function') return;
    const body = new Blob([JSON.stringify({ token, positionSec: Math.floor(positionSec) })], {
      type: 'application/json',
    });
    navigator.sendBeacon(`/api/student/lessons/${lessonId}/progress/beacon`, body);
  }
}
