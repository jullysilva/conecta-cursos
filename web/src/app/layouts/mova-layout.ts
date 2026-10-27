import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { LearningService } from '../core/services/learning.service';

/**
 * Student frame in Mova's style: fixed black header with section anchors and
 * profile menu, a green bar with the overall progress, then the routed page.
 */
@Component({
  selector: 'cp-mova-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './mova-layout.html',
  styleUrl: './mova-layout.scss',
  host: {
    class: 'theme-mova',
    '(document:keydown.escape)': 'menuOpen.set(false)',
    '(document:click)': 'closeMenuOnOutsideClick($event)',
  },
})
export class MovaLayout {
  private readonly learning = inject(LearningService);
  protected readonly auth = inject(AuthService);

  protected readonly menuOpen = signal(false);
  protected readonly categories = rxResource({ stream: () => this.learning.categories() });
  protected readonly summary = rxResource({ stream: () => this.learning.summary() });

  /** Share of lessons completed across every course the student has started. */
  protected readonly overallProgress = computed(() => {
    const courses = this.summary.value()?.courses ?? [];
    const total = courses.reduce((sum, course) => sum + course.progress.totalLessons, 0);
    const done = courses.reduce((sum, course) => sum + course.progress.completedLessons, 0);
    return total ? Math.round((done / total) * 100) : 0;
  });

  protected toggleMenu(event: Event): void {
    event.stopPropagation();
    this.menuOpen.update((open) => !open);
  }

  protected closeMenuOnOutsideClick(event: Event): void {
    if (!(event.target as HTMLElement).closest('.profile')) this.menuOpen.set(false);
  }
}
