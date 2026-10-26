import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import type { CourseCard as CourseCardModel } from '../../core/models/models';
import { LearningService } from '../../core/services/learning.service';
import { CourseCard } from '../../shared/components/course-card';
import { CourseCover } from '../../shared/components/course-cover';
import { EmptyState } from '../../shared/components/empty-state';
import { ProgressRail } from '../../shared/components/progress-rail';
import { BannerCarousel } from './banner-carousel';

@Component({
  selector: 'cp-home',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CourseCard, CourseCover, EmptyState, ProgressRail, BannerCarousel],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home {
  private readonly learning = inject(LearningService);
  protected readonly auth = inject(AuthService);

  protected readonly summary = rxResource({ stream: () => this.learning.summary() });
  protected readonly banners = rxResource({ stream: () => this.learning.banners() });
  protected readonly categories = rxResource({ stream: () => this.learning.categories() });
  protected readonly featured = rxResource({ stream: () => this.learning.featuredCourse() });
  protected readonly paths = rxResource({ stream: () => this.learning.learningPaths() });

  protected readonly firstName = computed(() => this.auth.user()?.name.split(' ')[0] ?? '');
  protected readonly resume = computed(() => this.summary.value()?.continueWatching[0] ?? null);
  protected readonly otherInProgress = computed<CourseCardModel[]>(() =>
    (this.summary.value()?.continueWatching.slice(1) ?? []).map((course) => ({
      ...course,
      slug: '',
      description: '',
    })),
  );
}
