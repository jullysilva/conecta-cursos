import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { ConfirmService } from '../../../core/services/confirm.service';
import { ToastService } from '../../../core/services/toast.service';
import type { AdminBanner } from '../../../core/models/admin.models';
import { EmptyState } from '../../../shared/components/empty-state';
import { errorMessage } from '../../../shared/utils/http-error';

@Component({
  selector: 'cp-banner-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EmptyState],
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <h1>Banners</h1>
          <p>Destaques exibidos no carrossel da página inicial dos alunos.</p>
        </div>
        <a routerLink="/adm/banners/edit/novo" class="btn btn-primary">
          <i class="ri-add-line" aria-hidden="true"></i> Novo banner
        </a>
      </header>

      @if (banners.value(); as list) {
        @if (list.length) {
          <ul class="grid">
            @for (banner of list; track banner.id) {
              <li class="panel">
                <img [src]="banner.imageUrl" alt="" loading="lazy" />
                <div class="body">
                  <a [routerLink]="['/adm/banners/edit', banner.id]"><strong>{{ banner.title }}</strong></a>
                  <span class="muted">Ordem {{ banner.position }}</span>
                  <span class="badge" [class.is-positive]="banner.active">{{ banner.active ? 'Ativo' : 'Inativo' }}</span>
                </div>
                <button type="button" class="btn btn-ghost btn-icon" (click)="remove(banner)" [attr.aria-label]="'Excluir banner ' + banner.title" title="Excluir">
                  <i class="ri-delete-bin-line" aria-hidden="true"></i>
                </button>
              </li>
            }
          </ul>
        } @else {
          <cp-empty-state icon="ri-image-line" title="Nenhum banner" text="Crie um banner para destacar cursos ou avisos na página inicial." />
        }
      }
    </div>
  `,
  styles: `
    .grid { display: grid; gap: 0.75rem; margin: 0; padding: 0; list-style: none; }
    li { display: grid; grid-template-columns: 200px 1fr auto; gap: 1.25rem; align-items: center; padding: 0.75rem; }
    img { width: 200px; aspect-ratio: 16 / 5; object-fit: cover; border-radius: var(--radius-sm); background: var(--line); }
    .body { display: flex; align-items: center; gap: 1rem; }
  `,
})
export class BannerList {
  private readonly api = inject(AdminApiService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  protected readonly banners = rxResource({ stream: () => this.api.banners() });

  protected async remove(banner: AdminBanner): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: 'Excluir banner?',
      message: `"${banner.title}" deixará de aparecer na página inicial.`,
      confirmLabel: 'Excluir banner',
      danger: true,
    });
    if (!confirmed) return;
    this.api.deleteBanner(banner.id).subscribe({
      next: () => {
        this.toast.success('Banner excluído.');
        this.banners.reload();
      },
      error: (error: unknown) => this.toast.error(errorMessage(error)),
    });
  }
}
