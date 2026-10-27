import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { ADMIN_DARK_CLASS, ADMIN_DARK_KEY, Shell } from './shell';

describe('Shell', () => {
  const root = document.documentElement;

  async function render() {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { user: () => ({ name: 'Ana Lima', email: 'ana@x.com' }), logout: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(Shell);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    const toggle = el.querySelector<HTMLButtonElement>('[role="switch"]')!;
    return { fixture, el, toggle };
  }

  afterEach(() => {
    localStorage.clear();
    root.classList.remove(ADMIN_DARK_CLASS);
  });

  it('starts dark by default and exposes the toggle as a checked switch', async () => {
    const { toggle } = await render();
    expect(root.classList.contains(ADMIN_DARK_CLASS)).toBe(true);
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    expect(toggle.textContent).toContain('Tema escuro');
  });

  it('switches to light, saves the choice and restores it on the next visit', async () => {
    const { fixture, toggle } = await render();
    toggle.click();
    await fixture.whenStable();
    expect(root.classList.contains(ADMIN_DARK_CLASS)).toBe(false);
    expect(toggle.getAttribute('aria-checked')).toBe('false');
    expect(localStorage.getItem(ADMIN_DARK_KEY)).toBe('0');

    fixture.destroy();
    TestBed.resetTestingModule();
    await render();
    expect(root.classList.contains(ADMIN_DARK_CLASS)).toBe(false);
  });

  it('removes the theme from the page when leaving the admin area', async () => {
    const { fixture } = await render();
    fixture.destroy();
    expect(root.classList.contains(ADMIN_DARK_CLASS)).toBe(false);
  });

  it('shows the signed-in user initials', async () => {
    const { el } = await render();
    expect(el.querySelector('.avatar')?.textContent?.trim()).toBe('AL');
  });
});
