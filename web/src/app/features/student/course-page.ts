import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LearningService } from '../../core/services/learning.service';
import { formatDuration } from '../../shared/utils/format';
import { CourseFrame } from './course-parts/course-frame';
import { valueOf } from '../../shared/utils/resource';

type CourseStage = 'start' | 'continue' | 'done';

const ACTION_COPY: Record<CourseStage, { title: string; subtitle: string; cta: string; icon: string }> = {
  start: {
    title: 'Comece por aqui',
    subtitle: 'Este botão abre a primeira aula do curso. Depois, ele leva você direto para onde parou.',
    cta: 'Começar curso',
    icon: 'ri-play-fill',
  },
  continue: {
    title: 'Continue de onde parou',
    subtitle: 'Retome a última aula que você assistiu.',
    cta: 'Continuar',
    icon: 'ri-play-fill',
  },
  done: {
    title: 'Curso concluído',
    subtitle: 'Reveja qualquer aula quando quiser.',
    cta: 'Rever aulas',
    icon: 'ri-check-line',
  },
};

/** Course overview in Mova's layout: hero, call to action, presentation and module grid. */
@Component({
  selector: 'cp-course-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CourseFrame],
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
  /** Module whose lessons are expanded below the module grid. */
  protected readonly expandedModuleId = signal<string | null>(null);
  protected readonly formatDuration = formatDuration;

  protected readonly stage = computed<CourseStage>(() => {
    const progress = valueOf(this.course)?.progress;
    if (!progress || progress.completedLessons === 0) return 'start';
    return progress.percent === 100 ? 'done' : 'continue';
  });
  protected readonly action = computed(() => ACTION_COPY[this.stage()]);

  protected readonly expandedModule = computed(
    () => valueOf(this.course)?.modules.find((module) => module.id === this.expandedModuleId()) ?? null,
  );

  protected toggleModule(id: string): void {
    this.expandedModuleId.update((current) => (current === id ? null : id));
  }

  protected completedIn(moduleId: string): number {
    const module = valueOf(this.course)?.modules.find((item) => item.id === moduleId);
    return module?.lessons.filter((lesson) => lesson.completed).length ?? 0;
  }
}
