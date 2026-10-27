import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LearningService } from '../../core/services/learning.service';
import { CourseCover } from '../../shared/components/course-cover';
import { EmptyState } from '../../shared/components/empty-state';
import { ProgressRail } from '../../shared/components/progress-rail';
import { formatDuration } from '../../shared/utils/format';

@Component({
  selector: 'cp-course-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CourseCover, EmptyState, ProgressRail],
  templateUrl: './course-page.html',
  styleUrl: './course-page.scss',
})
export class CoursePage {
  private readonly learning = inject(LearningService);

  /** Bound from the route parameter :idCourse. */
  readonly idCourse = input.required<string>();

  protected readonly course = rxResource({
    params: () => this.idCourse(),
    stream: ({ params }) => this.learning.course(params),
  });
  protected readonly collapsed = signal<ReadonlySet<string>>(new Set());
  protected readonly formatDuration = formatDuration;

  protected readonly totalDuration = computed(() =>
    (this.course.value()?.modules ?? [])
      .flatMap((module) => module.lessons)
      .reduce((sum, lesson) => sum + lesson.durationSec, 0),
  );

  protected readonly ctaLabel = computed(() => {
    const progress = this.course.value()?.progress;
    if (!progress || progress.completedLessons === 0) return 'Começar curso';
    return progress.percent === 100 ? 'Rever curso' : 'Continuar curso';
  });

  protected toggle(moduleId: string): void {
    this.collapsed.update((current) => {
      const next = new Set(current);
      if (next.has(moduleId)) next.delete(moduleId);
      else next.add(moduleId);
      return next;
    });
  }
}
