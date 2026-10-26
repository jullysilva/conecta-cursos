import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { AdminApiService } from '../../core/services/admin-api.service';
import { ConfirmService } from '../../core/services/confirm.service';
import { ToastService } from '../../core/services/toast.service';
import type { Category } from '../../core/models/admin.models';
import { EmptyState } from '../../shared/components/empty-state';
import { errorMessage } from '../../shared/utils/http-error';

@Component({
  selector: 'cp-categories',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, EmptyState],
  template: `
    <div class="page narrow">
      <header class="page-head">
        <div>
          <h1>Categorias</h1>
          <p>Agrupam os cursos em prateleiras na página inicial, na ordem definida aqui.</p>
        </div>
      </header>

      <form class="toolbar" (ngSubmit)="create()">
        <label class="sr-only" for="category-name">Nome da nova categoria</label>
        <input id="category-name" name="name" class="input" placeholder="Nome da nova categoria"
          [ngModel]="newName()" (ngModelChange)="newName.set($event)" />
        <button type="submit" class="btn btn-primary" [disabled]="newName().trim().length < 2">
          <i class="ri-add-line" aria-hidden="true"></i> Adicionar categoria
        </button>
      </form>

      @if (categories.value(); as list) {
        @if (list.length) {
          <div class="panel">
            <table class="table">
              <thead>
                <tr>
                  <th scope="col">Ordem</th>
                  <th scope="col">Nome</th>
                  <th scope="col">Cursos</th>
                  <th scope="col" class="actions"><span class="sr-only">Ações</span></th>
                </tr>
              </thead>
              <tbody>
                @for (category of list; track category.id) {
                  <tr>
                    <td class="order">
                      <label class="sr-only" [for]="'pos-' + category.id">Ordem de {{ category.name }}</label>
                      <input class="input" type="number" min="0" [id]="'pos-' + category.id" [value]="category.position"
                        (change)="update(category, { position: +$any($event.target).value })" />
                    </td>
                    <td>
                      <label class="sr-only" [for]="'name-' + category.id">Nome</label>
                      <input class="input" [id]="'name-' + category.id" [value]="category.name"
                        (change)="update(category, { name: $any($event.target).value.trim() })" />
                    </td>
                    <td>{{ category._count?.courses ?? 0 }}</td>
                    <td class="actions">
                      <button type="button" class="btn btn-ghost btn-icon" (click)="remove(category)"
                        [attr.aria-label]="'Excluir ' + category.name" title="Excluir">
                        <i class="ri-delete-bin-line" aria-hidden="true"></i>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <cp-empty-state icon="ri-price-tag-3-line" title="Nenhuma categoria"
            text="Crie categorias para organizar os cursos na página inicial." />
        }
      }
    </div>
  `,
  styles: `
    .narrow { max-width: 860px; }
    .order { width: 6.5rem; }
    .table .input { min-height: 2.25rem; }
  `,
})
export class Categories {
  private readonly api = inject(AdminApiService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);

  protected readonly categories = rxResource({ stream: () => this.api.categories() });
  protected readonly newName = signal('');

  protected create(): void {
    const name = this.newName().trim();
    const position = this.categories.value()?.length ?? 0;
    this.run(this.api.createCategory({ name, position }), 'Categoria adicionada.');
    this.newName.set('');
  }

  protected update(category: Category, change: Partial<Pick<Category, 'name' | 'position'>>): void {
    if (change.name !== undefined && change.name.length < 2) {
      this.toast.error('O nome precisa ter pelo menos 2 caracteres.');
      return;
    }
    this.run(this.api.updateCategory(category.id, change), 'Categoria salva.');
  }

  protected async remove(category: Category): Promise<void> {
    const confirmed = await this.confirm.ask({
      title: 'Excluir categoria?',
      message: `Os cursos de "${category.name}" continuam existindo, mas ficam sem categoria e saem da página inicial.`,
      confirmLabel: 'Excluir categoria',
      danger: true,
    });
    if (confirmed) this.run(this.api.deleteCategory(category.id), 'Categoria excluída.');
  }

  private run(request: Observable<unknown>, success: string): void {
    request.subscribe({
      next: () => {
        this.toast.success(success);
        this.categories.reload();
      },
      error: (error: unknown) => this.toast.error(errorMessage(error)),
    });
  }
}
