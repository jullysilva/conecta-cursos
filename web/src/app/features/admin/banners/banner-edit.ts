import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { ToastService } from '../../../core/services/toast.service';
import { fromDateTimeLocal, toDateTimeLocal } from '../../../shared/utils/format';
import { errorMessage } from '../../../shared/utils/http-error';
import { valueOf } from '../../../shared/utils/resource';

const NEW_ID = 'novo';

@Component({
  selector: 'cp-banner-edit',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="page narrow">
      <a routerLink="/adm/banners" class="back"><i class="ri-arrow-left-line" aria-hidden="true"></i> Banners</a>
      <h1>{{ isNew() ? 'Novo banner' : 'Editar banner' }}</h1>

      <form class="panel form" [formGroup]="form" (ngSubmit)="save()" novalidate>
        @if (form.controls.imageUrl.valid && form.controls.imageUrl.value) {
          <img class="preview" [src]="form.controls.imageUrl.value" alt="Pré-visualização do banner" />
        }
        <div class="form-grid">
          <div class="field span-2">
            <label for="banner-title">Título</label>
            <input id="banner-title" class="input" formControlName="title" />
            @if (form.controls.title.touched && form.controls.title.invalid) {
              <span class="error">Informe um título com 2 a 160 caracteres.</span>
            }
          </div>
          <div class="field span-2">
            <label for="banner-subtitle">Subtítulo</label>
            <input id="banner-subtitle" class="input" formControlName="subtitle" />
          </div>
          <div class="field span-2">
            <label for="banner-image">Imagem (URL)</label>
            <input id="banner-image" class="input" type="url" formControlName="imageUrl" placeholder="https://" />
            <span class="hint">Use uma imagem larga, por volta de 1600 × 500 px.</span>
            @if (form.controls.imageUrl.touched && form.controls.imageUrl.invalid) {
              <span class="error">Informe um endereço que comece com http:// ou https://.</span>
            }
          </div>
          <div class="field span-2">
            <label for="banner-link">Link ao clicar</label>
            <input id="banner-link" class="input" formControlName="linkUrl" placeholder="/trilhas ou https://…" />
            <span class="hint">Endereços que começam com / abrem dentro da plataforma.</span>
          </div>
          <div class="field">
            <label for="banner-start">Exibir a partir de</label>
            <input id="banner-start" class="input" type="datetime-local" formControlName="startsAt" />
          </div>
          <div class="field">
            <label for="banner-end">Exibir até</label>
            <input id="banner-end" class="input" type="datetime-local" formControlName="endsAt" />
          </div>
          <div class="field">
            <label for="banner-position">Ordem</label>
            <input id="banner-position" class="input" type="number" min="0" formControlName="position" />
          </div>
          <label class="check align-end"><input type="checkbox" formControlName="active" /> Ativo</label>
        </div>
        <button type="submit" class="btn btn-primary" [disabled]="saving()">
          {{ isNew() ? 'Criar banner' : 'Salvar banner' }}
        </button>
      </form>
    </div>
  `,
  styles: `
    .narrow { max-width: 760px; }
    .back { display: inline-flex; gap: 0.375rem; font-weight: 600; text-decoration: none; }
    .form { display: grid; gap: 1.25rem; padding: 1.5rem; justify-items: start; }
    .form-grid { width: 100%; }
    .preview { width: 100%; aspect-ratio: 16 / 5; object-fit: cover; border-radius: var(--radius-md); }
    .align-end { align-self: end; min-height: 2.625rem; }
  `,
})
export class BannerEdit {
  private readonly api = inject(AdminApiService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly id = input.required<string>();
  protected readonly isNew = computed(() => this.id() === NEW_ID);
  protected readonly saving = signal(false);
  protected readonly banner = rxResource({
    params: () => (this.isNew() ? undefined : this.id()),
    stream: ({ params }) => this.api.banner(params),
  });

  protected readonly form = inject(FormBuilder).nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(160)]],
    subtitle: [''],
    imageUrl: ['', [Validators.required, Validators.pattern(/^https?:\/\/.+/i)]],
    linkUrl: [''],
    startsAt: [''],
    endsAt: [''],
    position: [0],
    active: [true],
  });

  constructor() {
    effect(() => {
      const banner = valueOf(this.banner);
      if (!banner) return;
      this.form.reset({
        ...banner,
        linkUrl: banner.linkUrl ?? '',
        startsAt: toDateTimeLocal(banner.startsAt),
        endsAt: toDateTimeLocal(banner.endsAt),
      });
    });
  }

  protected save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const value = this.form.getRawValue();
    const payload = {
      ...value,
      title: value.title.trim(),
      linkUrl: value.linkUrl.trim() || null,
      startsAt: fromDateTimeLocal(value.startsAt),
      endsAt: fromDateTimeLocal(value.endsAt),
      position: Number(value.position),
    };
    this.saving.set(true);
    const request = this.isNew() ? this.api.createBanner(payload) : this.api.updateBanner(this.id(), payload);
    request.subscribe({
      next: () => {
        this.toast.success(this.isNew() ? 'Banner criado.' : 'Banner salvo.');
        void this.router.navigate(['/adm/banners']);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.toast.error(errorMessage(error));
      },
    });
  }
}
