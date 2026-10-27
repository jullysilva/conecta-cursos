import { ChangeDetectionStrategy, Component, computed, input, linkedSignal, signal } from '@angular/core';
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
  host: { '[class.is-collapsed]': 'collapsed()' },
})
export class CourseFrame {
  readonly course = input.required<CourseDetail>();
  /** Lesson being watched, highlighted in the outline and whose module starts open. */
  readonly currentLessonId = input<string | null>(null);

  protected readonly collapsed = signal(readStoredFlag(COLLAPSED_KEY));
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

  protected toggleModule(id: string): void {
    this.openModules.update((open) => {
      const next = new Set(open);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
}
