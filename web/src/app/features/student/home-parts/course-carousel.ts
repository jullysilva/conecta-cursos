import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SwipeTracker } from '../../../shared/utils/swipe';

export interface CarouselCourse {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string | null;
  lessonsCount: number;
  workloadHours: number;
  /** Completion percentage; undefined hides the progress bar. */
  progress?: number;
  link: string[];
}

export interface ItemsPerPage {
  tablet: number;
  desktop: number;
}

/** Below this width every row shows two posters per page and pages by swipe. */
const MOBILE_MAX_WIDTH = 768;
const MOBILE_ITEMS_PER_PAGE = 2;

/** Default density for full-width rows, by viewport width. */
function defaultItemsPerPage(width: number): number {
  if (width < MOBILE_MAX_WIDTH) return MOBILE_ITEMS_PER_PAGE;
  if (width >= 1400) return 6;
  if (width >= 1200) return 5;
  if (width >= 992) return 4;
  return 3;
}

/**
 * Paged row of poster cards in Mova's style. Clicking a card reveals its
 * details over the poster, with the action to start or continue the course.
 */
@Component({
  selector: 'cp-course-carousel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './course-carousel.html',
  styleUrl: './course-carousel.scss',
  host: {
    '[class.is-compact]': 'compact()',
    '(window:resize)': 'width.set($any($event.target).innerWidth)',
    '(keydown.escape)': 'activeId.set(null)',
  },
})
export class CourseCarousel {
  readonly title = input.required<string>();
  readonly anchorId = input<string | null>(null);
  readonly courses = input.required<CarouselCourse[]>();
  readonly itemsPerPageConfig = input<ItemsPerPage | null>(null);
  /** Compact rows sit inside a grid column: no side gutters, fades or arrows inset. */
  readonly compact = input(false);

  protected readonly width = signal(typeof window === 'undefined' ? 1200 : window.innerWidth);
  protected readonly page = signal(0);
  protected readonly activeId = signal<string | null>(null);
  protected readonly listId = `carousel-${Math.random().toString(36).slice(2, 8)}`;

  protected readonly itemsPerPage = computed(() => {
    const config = this.itemsPerPageConfig();
    if (!config || this.width() < MOBILE_MAX_WIDTH) return defaultItemsPerPage(this.width());
    return this.width() <= 992 ? config.tablet : config.desktop;
  });
  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.courses().length / this.itemsPerPage())),
  );
  protected readonly pages = computed(() => Array.from({ length: this.pageCount() }, (_, i) => i));
  /** Index of the first visible card; the last page is trimmed so it stays full. */
  protected readonly firstVisible = computed(() => {
    const perPage = this.itemsPerPage();
    const lastStart = Math.max(0, this.courses().length - perPage);
    return Math.min(Math.min(this.page(), this.pageCount() - 1) * perPage, lastStart);
  });
  protected readonly offset = computed(
    () => `calc(${-this.firstVisible()} * (100% + 1rem) / ${this.itemsPerPage()})`,
  );

  /** Keeps every card in a row the same height: progress shows for all once any course has started. */
  protected readonly showProgress = computed(() =>
    this.courses().some((course) => (course.progress ?? 0) > 0),
  );

  protected isVisible(index: number): boolean {
    return index >= this.firstVisible() && index < this.firstVisible() + this.itemsPerPage();
  }

  protected go(page: number): void {
    this.activeId.set(null);
    this.page.set(Math.min(Math.max(page, 0), this.pageCount() - 1));
  }

  protected readonly swipe = new SwipeTracker();

  protected onSwipe(step: number): void {
    if (step) this.go(this.page() + step);
  }

  protected toggle(id: string): void {
    this.activeId.update((current) => (current === id ? null : id));
  }
}
