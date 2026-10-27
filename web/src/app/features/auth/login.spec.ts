import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { Login } from './login';

describe('Login', () => {
  const login = vi.fn();

  async function setup(redirect: string | null = null) {
    login.mockReset();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { login } },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(redirect ? { redirect } : {}) } } },
      ],
    });
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    const fixture = TestBed.createComponent(Login);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const type = (selector: string, value: string) => {
      const input = el.querySelector<HTMLInputElement>(selector)!;
      input.value = value;
      input.dispatchEvent(new Event('input'));
    };
    const submit = async () => {
      el.querySelector<HTMLButtonElement>('button[type=submit]')!.click();
      await fixture.whenStable();
    };
    return { fixture, el, type, submit, navigate };
  }

  it('shows validation messages and does not call the API with empty fields', async () => {
    const { el, submit } = await setup();
    await submit();
    expect(login).not.toHaveBeenCalled();
    expect(el.textContent).toContain('Informe um e-mail válido.');
    expect(el.textContent).toContain('Informe sua senha.');
  });

  it('sends students home and admins to the admin area', async () => {
    const student = await setup();
    login.mockReturnValue(of({ role: 'STUDENT' }));
    student.type('#email', 'ana@x.com');
    student.type('#password', 'secret');
    await student.submit();
    expect(login).toHaveBeenCalledWith('ana@x.com', 'secret');
    expect(student.navigate).toHaveBeenCalledWith('/home');

    TestBed.resetTestingModule();
    const admin = await setup();
    login.mockReturnValue(of({ role: 'ADMIN' }));
    admin.type('#email', 'adm@x.com');
    admin.type('#password', 'secret');
    await admin.submit();
    expect(admin.navigate).toHaveBeenCalledWith('/adm');
  });

  it('honours a safe redirect and ignores external ones', async () => {
    const safe = await setup('/curso/1');
    login.mockReturnValue(of({ role: 'STUDENT' }));
    safe.type('#email', 'ana@x.com');
    safe.type('#password', 'secret');
    await safe.submit();
    expect(safe.navigate).toHaveBeenCalledWith('/curso/1');

    TestBed.resetTestingModule();
    const unsafe = await setup('https://evil.example');
    login.mockReturnValue(of({ role: 'STUDENT' }));
    unsafe.type('#email', 'ana@x.com');
    unsafe.type('#password', 'secret');
    await unsafe.submit();
    expect(unsafe.navigate).toHaveBeenCalledWith('/home');
  });

  it('shows the API error and re-enables the button', async () => {
    const { el, type, submit } = await setup();
    login.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 401, error: { message: 'Credenciais inválidas' } })));
    type('#email', 'ana@x.com');
    type('#password', 'errada');
    await submit();
    expect(el.querySelector('[role=alert]')?.textContent).toContain('Credenciais inválidas');
    expect(el.querySelector<HTMLButtonElement>('button[type=submit]')!.disabled).toBe(false);
  });

  it('toggles password visibility', async () => {
    const { el, fixture } = await setup();
    const toggle = el.querySelector<HTMLButtonElement>('button[aria-label="Mostrar senha"]')!;
    toggle.click();
    await fixture.whenStable();
    expect(el.querySelector<HTMLInputElement>('#password')!.type).toBe('text');
  });
});
