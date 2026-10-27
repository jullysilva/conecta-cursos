import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { EmptyState } from '../../../shared/components/empty-state';
import { Pagination } from '../../../shared/components/pagination';
import { debouncedSignal } from '../../../shared/utils/debounced-signal';

const PAGE_SIZE = 20;

@Component({
  selector: 'cp-user-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, EmptyState, Pagination],
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <h1>Usuários</h1>
          <p>Alunos e administradores com acesso à plataforma.</p>
        </div>
        <a routerLink="/adm/usuarios/novo" class="btn btn-primary">
          <i class="ri-user-add-line" aria-hidden="true"></i> Novo usuário
        </a>
      </header>

      <div class="toolbar">
        <label class="sr-only" for="user-search">Buscar usuário</label>
        <input id="user-search" class="input" type="search" placeholder="Buscar por nome ou e-mail"
          [value]="search()" (input)="search.set($any($event.target).value); page.set(1)" />
        <label class="sr-only" for="user-role">Filtrar por perfil</label>
        <select id="user-role" class="input role" [value]="role()" (change)="role.set($any($event.target).value); page.set(1)">
          <option value="">Todos os perfis</option>
          <option value="STUDENT">Alunos</option>
          <option value="ADMIN">Administradores</option>
        </select>
      </div>

      @if (users.hasValue() && users.value(); as result) {
        @if (result.items.length) {
          <div class="panel">
            <table class="table">
              <thead>
                <tr><th scope="col">Nome</th><th scope="col">E-mail</th><th scope="col">Perfil</th><th scope="col">Situação</th><th scope="col">Cadastro</th></tr>
              </thead>
              <tbody>
                @for (user of result.items; track user.id) {
                  <tr>
                    <td><a [routerLink]="['/adm/usuarios', user.id]"><strong>{{ user.name }}</strong></a></td>
                    <td>{{ user.email }}</td>
                    <td>{{ user.role === 'ADMIN' ? 'Administrador' : 'Aluno' }}</td>
                    <td><span class="badge" [class.is-positive]="user.active">{{ user.active ? 'Ativo' : 'Inativo' }}</span></td>
                    <td>{{ dateFormat.format(toDate(user.createdAt)) }}</td>
                  </tr>
                }
              </tbody>
            </table>
            <cp-pagination [page]="page()" [pageSize]="pageSize" [total]="result.total" (pageChange)="page.set($event)" />
          </div>
        } @else {
          <cp-empty-state icon="ri-team-line" title="Nenhum usuário encontrado" text="Ajuste a busca ou o filtro de perfil." />
        }
      }
    </div>
  `,
  styles: `.role { max-width: 220px; }`,
})
export class UserList {
  private readonly api = inject(AdminApiService);
  protected readonly pageSize = PAGE_SIZE;
  protected readonly page = signal(1);
  protected readonly search = signal('');
  protected readonly role = signal('');
  private readonly debouncedSearch = debouncedSignal(this.search, 300);
  protected readonly dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' });

  protected readonly users = rxResource({
    params: () => ({ page: this.page(), pageSize: PAGE_SIZE, search: this.debouncedSearch(), role: this.role() }),
    stream: ({ params }) => this.api.users(params),
  });

  protected toDate(value: string): Date {
    return new Date(value);
  }
}
