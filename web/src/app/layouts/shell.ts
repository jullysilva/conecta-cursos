import { ChangeDetectionStrategy, Component, DOCUMENT, DestroyRef, computed, effect, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { initials } from '../shared/utils/format';
import { readStoredFlag, writeStoredFlag } from '../shared/utils/storage';
import { BRAND_NAME } from '../shared/brand';
import { BrandMark } from '../shared/components/brand-mark';

interface NavItem {
  label: string;
  icon: string;
  link: string;
  exact?: boolean;
}

/** Admin theme preference; dark is the default. */
export const ADMIN_DARK_KEY = 'cp.admin-dark-theme';
export const ADMIN_DARK_CLASS = 'theme-admin-dark';

const ADMIN_NAV: NavItem[] = [
  { label: 'Visão geral', icon: 'ri-dashboard-3-line', link: '/adm', exact: true },
  { label: 'Cursos', icon: 'ri-book-open-line', link: '/adm/cursos' },
  { label: 'Categorias', icon: 'ri-price-tag-3-line', link: '/adm/categorias' },
  { label: 'Trilhas', icon: 'ri-route-line', link: '/adm/trilhas' },
  { label: 'Banners', icon: 'ri-image-line', link: '/adm/banners' },
  { label: 'Usuários', icon: 'ri-team-line', link: '/adm/usuarios' },
];

/** Admin frame: navigation rail + routed content. The student area uses MovaLayout. */
@Component({
  selector: 'cp-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, BrandMark],
  templateUrl: './shell.html',
  styleUrl: './shell.scss',
})
export class Shell {
  protected readonly auth = inject(AuthService);
  protected readonly brandName = BRAND_NAME;
  protected readonly nav = ADMIN_NAV;
  protected readonly userInitials = computed(() => initials(this.auth.user()?.name ?? ''));
  protected readonly dark = signal(readStoredFlag(ADMIN_DARK_KEY, true));

  constructor() {
    // The class lives on <html> so the body, dialogs and toasts share the admin theme.
    const root = inject(DOCUMENT).documentElement;
    effect(() => root.classList.toggle(ADMIN_DARK_CLASS, this.dark()));
    inject(DestroyRef).onDestroy(() => root.classList.remove(ADMIN_DARK_CLASS));
  }

  protected toggleTheme(): void {
    this.dark.update((value) => !value);
    writeStoredFlag(ADMIN_DARK_KEY, this.dark());
  }
}
