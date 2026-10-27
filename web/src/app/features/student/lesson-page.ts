import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, linkedSignal, signal, viewChild } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { Router, RouterLink } from '@angular/router';
import { LearningService } from '../../core/services/learning.service';
import { ToastService } from '../../core/services/toast.service';
import { VideoPlayer } from '../../shared/components/video-player';
import { errorMessage } from '../../shared/utils/http-error';
import { CourseFrame } from './course-parts/course-frame';
import { valueOf } from '../../shared/utils/resource';

const AUTOPLAY_KEY = 'cp.autoplay-next-lesson';

function readAutoplay(): boolean {
  try {
    return localStorage.getItem(AUTOPLAY_KEY) === '1';
  } catch {
    return false;
  }
}

/** Lesson in Mova's layout: course sidebar, player, status badges and pager with autoplay. */
@Component({
  selector: 'cp-lesson-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CourseFrame, VideoPlayer],
  templateUrl: './lesson-page.html',
  styleUrl: './lesson-page.scss',
  host: { '(window:beforeunload)': 'saveOnExit()' },
})
export class LessonPage {
  private readonly learning = inject(LearningService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  /** Bound from the route parameter :idLesson. */
  readonly idLesson = input.required<string>();

  private readonly player = viewChild(VideoPlayer);

  protected readonly lesson = rxResource({
    params: () => this.idLesson(),
    stream: ({ params }) => this.learning.lesson(params),
  });
  protected readonly outline = rxResource({
    params: () => valueOf(this.lesson)?.course.id,
    stream: ({ params }) => this.learning.course(params),
  });
  protected readonly completed = linkedSignal(() => valueOf(this.lesson)?.progress.completed ?? false);
  protected readonly autoplay = signal(readAutoplay());

  constructor() {
    inject(DestroyRef).onDestroy(() => this.saveOnExit());
  }

  protected onPosition(seconds: number): void {
    this.learning.saveProgress(this.idLesson(), seconds).subscribe({ error: () => undefined });
  }

  protected onEnded(): void {
    if (!this.completed()) this.setCompleted(true);
    const next = valueOf(this.lesson)?.nextLessonId;
    if (this.autoplay() && next) void this.router.navigate(['/aula', next]);
  }

  protected toggleAutoplay(value: boolean): void {
    this.autoplay.set(value);
    try {
      localStorage.setItem(AUTOPLAY_KEY, value ? '1' : '0');
    } catch {
      // Without storage the preference lasts only for this page.
    }
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
    const lesson = valueOf(this.lesson);
    if (lesson && position > 0) this.learning.saveProgressOnExit(lesson.id, position);
  }
}
