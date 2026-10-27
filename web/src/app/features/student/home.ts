import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import type { CourseCard, EnrolledCourse } from '../../core/models/models';
import { LearningService } from '../../core/services/learning.service';
import { CarouselCourse, CourseCarousel, ItemsPerPage } from './home-parts/course-carousel';
import { MovaBanner } from './home-parts/mova-banner';
import { valueOf } from '../../shared/utils/resource';

const PROGRESS_ROW: ItemsPerPage = { tablet: 2, desktop: 3 };
const FEATURED_ROW: ItemsPerPage = { tablet: 2, desktop: 1 };
const SKELETON_CARDS = [0, 1, 2, 3, 4, 5];

function fromCatalog(course: CourseCard): CarouselCourse {
  const percent = course.progress?.percent ?? 0;
  return {
    id: course.id,
    title: course.title,
    description: course.description,
    thumbnailUrl: course.thumbnailUrl,
    lessonsCount: course.progress?.totalLessons ?? 0,
    workloadHours: course.workloadHours,
    progress: percent,
    link: ['/curso', course.id],
  };
}

function fromEnrollment(course: EnrolledCourse): CarouselCourse {
  return {
    id: course.id,
    title: course.title,
    description: '',
    thumbnailUrl: course.thumbnailUrl,
    lessonsCount: course.progress.totalLessons,
    workloadHours: course.workloadHours,
    progress: course.progress.percent,
    link: course.lastLessonId ? ['/aula', course.lastLessonId] : ['/curso', course.id],
  };
}

/** Student home following Mova's layout: banner, progress row, then one row per category. */
@Component({
  selector: 'cp-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CourseCarousel, MovaBanner],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly learning = inject(LearningService);

  protected readonly summary = rxResource({ stream: () => this.learning.summary() });
  protected readonly banners = rxResource({ stream: () => this.learning.banners() });
  protected readonly categories = rxResource({ stream: () => this.learning.categories() });
  protected readonly featured = rxResource({ stream: () => this.learning.featuredCourse() });

  protected readonly progressRowConfig = PROGRESS_ROW;
  protected readonly featuredRowConfig = FEATURED_ROW;
  protected readonly skeletonCards = SKELETON_CARDS;

  /** "Continue assistindo" when there is progress, otherwise courses not started yet. */
  protected readonly progressCarousel = computed(() => {
    const watching = valueOf(this.summary)?.continueWatching ?? [];
    if (watching.length) {
      return { title: 'Continue assistindo', anchorId: 'continue-assistindo', courses: watching.map(fromEnrollment) };
    }
    const notStarted = (valueOf(this.categories) ?? [])
      .flatMap((category) => category.courses)
      .filter((course) => !course.progress?.completedLessons)
      .slice(0, 9)
      .map(fromCatalog);
    return notStarted.length
      ? { title: 'Recomendados para você', anchorId: 'recomendados', courses: notStarted }
      : null;
  });

  protected readonly featuredCarousel = computed(() => {
    const course = valueOf(this.featured);
    return course ? [fromCatalog(course)] : null;
  });

  protected readonly categoryCarousels = computed(() =>
    (valueOf(this.categories) ?? []).map((category) => ({
      id: category.id,
      title: category.name,
      anchorId: category.slug,
      courses: category.courses.map(fromCatalog),
    })),
  );
}
