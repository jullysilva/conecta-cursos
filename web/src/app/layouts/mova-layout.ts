import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter, map } from 'rxjs';
import { AuthService } from '../core/auth/auth.service';
import { LearningService } from '../core/services/learning.service';
import { valueOf } from '../shared/utils/resource';
import { BRAND_NAME } from '../shared/brand';
import { BrandMark } from '../shared/components/brand-mark';

/**
 * Student frame in Mova's style: fixed black header with section anchors and
 * profile menu, a green bar with the overall progress, then the routed page.
 */
@Component({
  selector: 'cp-mova-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BrandMark],
  templateUrl: './mova-layout.html',
  styleUrl: './mova-layout.scss',
  host: {
    class: 'theme-mova',
    '[class.is-compact]': 'compact()',
    '(document:keydown.escape)': 'menuOpen.set(false)',
    '(document:click)': 'closeMenuOnOutsideClick($event)',
  },
})
export class MovaLayout {
  private readonly learning = inject(LearningService);
  protected readonly auth = inject(AuthService);
  protected readonly brandName = BRAND_NAME;

  private readonly router = inject(Router);

  protected readonly menuOpen = signal(false);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );
  /** Course and lesson pages use Mova's compact frame: header only, no level bar. */
  protected readonly compact = computed(() => /^\/(curso|aula)\//.test(this.url()));
  protected readonly categories = rxResource({ stream: () => this.learning.categories() });
  protected readonly summary = rxResource({ stream: () => this.learning.summary() });

  /** Share of lessons completed across every course the student has started. */
  protected readonly overallProgress = computed(() => {
    const courses = valueOf(this.summary)?.courses ?? [];
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
