import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  input,
  linkedSignal,
  viewChild,
} from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LearningService } from '../../core/services/learning.service';
import { ToastService } from '../../core/services/toast.service';
import { EmptyState } from '../../shared/components/empty-state';
import { ProgressRail } from '../../shared/components/progress-rail';
import { VideoPlayer } from '../../shared/components/video-player';
import { formatDuration } from '../../shared/utils/format';
import { errorMessage } from '../../shared/utils/http-error';

@Component({
  selector: 'cp-lesson-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EmptyState, ProgressRail, VideoPlayer],
  templateUrl: './lesson-page.html',
  styleUrl: './lesson-page.scss',
  host: { '(window:beforeunload)': 'saveOnExit()' },
})
export class LessonPage {
  private readonly learning = inject(LearningService);
  private readonly toast = inject(ToastService);

  /** Bound from the route parameter :idLesson. */
  readonly idLesson = input.required<string>();

  private readonly player = viewChild(VideoPlayer);

  protected readonly lesson = rxResource({
    params: () => this.idLesson(),
    stream: ({ params }) => this.learning.lesson(params),
  });
  protected readonly outline = rxResource({
    params: () => this.lesson.value()?.course.id,
    stream: ({ params }) => this.learning.course(params),
  });
  protected readonly completed = linkedSignal(() => this.lesson.value()?.progress.completed ?? false);
  protected readonly formatDuration = formatDuration;

  protected readonly moduleNumber = computed(() => {
    const moduleId = this.lesson.value()?.module.id;
    const index = this.outline.value()?.modules.findIndex((module) => module.id === moduleId) ?? -1;
    return index + 1;
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.saveOnExit());
  }

  protected onPosition(seconds: number): void {
    this.learning.saveProgress(this.idLesson(), seconds).subscribe({ error: () => undefined });
  }

  protected onEnded(): void {
    if (!this.completed()) this.setCompleted(true);
  }

  protected setCompleted(value: boolean): void {
    const position = this.player()?.currentTime() ?? 0;
    this.completed.set(value);
    this.learning.saveProgress(this.idLesson(), position, value).subscribe({
      next: () => {
        if (value) this.toast.success('Aula concluída.');
        this.outline.reload();
      },
      error: (error: unknown) => {
        this.completed.set(!value);
        this.toast.error(errorMessage(error, 'Não foi possível salvar seu progresso.'));
      },
    });
  }

  protected saveOnExit(): void {
    const position = this.player()?.currentTime() ?? 0;
    const lesson = this.lesson.value();
    if (lesson && position > 0) this.learning.saveProgressOnExit(lesson.id, position);
  }
}
