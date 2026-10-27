import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { LearningService } from '../../core/services/learning.service';
import type { EnrolledCourse } from '../../core/models/models';

/** Profile in Mova's layout: identity card, then the course history as cards. */
@Component({
  selector: 'cp-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile {
  protected readonly auth = inject(AuthService);
  private readonly learning = inject(LearningService);
  private readonly confirm = inject(ConfirmService);

  protected readonly summary = rxResource({ stream: () => this.learning.summary() });
  protected readonly dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' });

  protected toDate(value: string): Date {
    return new Date(value);
  }

  protected isDone(course: EnrolledCourse): boolean {
    return course.progress.percent === 100;
  }

  protected async logout(): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: 'Sair da conta?',
      message: 'Você vai precisar entrar de novo.',
      confirmLabel: 'Sair',
    });
    if (confirmed) this.auth.logout();
  }
}
