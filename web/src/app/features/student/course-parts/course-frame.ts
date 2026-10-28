import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import type { CourseDetail } from '../../../core/models/models';
import { formatDuration } from '../../../shared/utils/format';
import { readStoredFlag, writeStoredFlag } from '../../../shared/utils/storage';

const COLLAPSED_KEY = 'cp.course-sidebar-collapsed';

/**
 * Mova's course frame: a fixed, collapsible sidebar with the course outline
 * (modules as accordions, lessons numbered and checked) beside the page content.
 */
@Component({
  selector: 'cp-course-frame',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './course-frame.html',
  styleUrl: './course-frame.scss',
  host: { '[class.is-collapsed]': 'collapsed()', '(document:keydown.escape)': 'closeDrawer()' },
})
export class CourseFrame {
  readonly course = input.required<CourseDetail>();
  /** Lesson being watched, highlighted in the outline and whose module starts open. */
  readonly currentLessonId = input<string | null>(null);

  protected readonly collapsed = signal(readStoredFlag(COLLAPSED_KEY));
  /** Mobile only: the outline opens as an overlay drawer, never persisted. */
  protected readonly drawerOpen = signal(false);
  private readonly drawerClose = viewChild<ElementRef<HTMLButtonElement>>('drawerClose');
  private readonly drawerTrigger = viewChild.required<ElementRef<HTMLButtonElement>>('drawerTrigger');
  private readonly injector = inject(Injector);
  protected readonly formatDuration = formatDuration;

  /** Lesson number across the whole course, as Mova shows ("Aula 4"). */
  protected readonly lessonNumbers = computed(() => {
    const numbers = new Map<string, number>();
    let n = 0;
    for (const module of this.course().modules) {
      for (const lesson of module.lessons) numbers.set(lesson.id, ++n);
    }
    return numbers;
  });

  /** Open modules: the current lesson's module, or the first one. */
  protected readonly openModules = linkedSignal<ReadonlySet<string>>(() => {
    const modules = this.course().modules;
    const current = modules.find((module) =>
      module.lessons.some((lesson) => lesson.id === this.currentLessonId()),
    );
    const initial = current ?? modules[0];
    return new Set(initial ? [initial.id] : []);
  });

  protected toggleCollapsed(): void {
    this.collapsed.update((value) => !value);
    writeStoredFlag(COLLAPSED_KEY, this.collapsed());
  }

  protected openDrawer(): void {
    this.drawerOpen.set(true);
    afterNextRender(() => this.drawerClose()?.nativeElement.focus(), { injector: this.injector });
  }

  /** Closes the drawer; focus returns to its trigger unless a lesson link is navigating away. */
  protected closeDrawer(restoreFocus = true): void {
    if (!this.drawerOpen()) return;
    this.drawerOpen.set(false);
    if (restoreFocus) this.drawerTrigger().nativeElement.focus();
  }

  protected toggleModule(id: string): void {
    this.openModules.update((open) => {
      const next = new Set(open);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
}
