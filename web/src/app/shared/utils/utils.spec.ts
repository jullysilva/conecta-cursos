import { HttpErrorResponse } from '@angular/common/http';
import { formatDuration, fromDateTimeLocal, initials, toDateTimeLocal } from './format';
import { errorMessage } from './http-error';
import { readStoredFlag, writeStoredFlag } from './storage';
import { SwipeTracker } from './swipe';
import { embedUrl, extractVideoId } from './video';

describe('format utils', () => {
  it.each([
    [0, '0:00'],
    [75, '1:15'],
    [3725, '1:02:05'],
    [-5, '0:00'],
  ])('formatDuration(%i) = %s', (input, expected) => expect(formatDuration(input)).toBe(expected));

  it('builds initials from first and last names', () => {
    expect(initials('Maria Souza Lima')).toBe('ML');
    expect(initials('ana')).toBe('A');
    expect(initials('  ')).toBe('?');
  });

  it('round-trips datetime-local values', () => {
    const iso = '2030-05-10T15:30:00.000Z';
    expect(fromDateTimeLocal(toDateTimeLocal(iso))).toBe(iso);
    expect(toDateTimeLocal(null)).toBe('');
    expect(fromDateTimeLocal('')).toBeNull();
  });
});

describe('video utils', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('extracts the YouTube id from %s', (ref, id) => expect(extractVideoId('YOUTUBE', ref)).toBe(id));

  it('extracts Vimeo ids', () => {
    expect(extractVideoId('VIMEO', 'https://vimeo.com/76979871')).toBe('76979871');
  });

  it('builds embed URLs per provider', () => {
    expect(embedUrl('YOUTUBE', 'dQw4w9WgXcQ', 42.7)).toBe(
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?rel=0&start=42',
    );
    expect(embedUrl('VIMEO', '123')).toBe('https://player.vimeo.com/video/123#t=0s');
    expect(embedUrl('PANDA', 'https://player.panda/embed/?v=x')).toBe('https://player.panda/embed/?v=x');
    expect(embedUrl('PANDA', 'not-a-url')).toBeNull();
    expect(embedUrl('URL', 'https://cdn/video.mp4')).toBeNull();
    expect(embedUrl('YOUTUBE', '  ')).toBeNull();
  });
});

describe('errorMessage', () => {
  const httpError = (status: number, error: unknown = null) => new HttpErrorResponse({ status, error });

  it('maps network, rate-limit and API messages', () => {
    expect(errorMessage(httpError(0))).toMatch(/conexão/);
    expect(errorMessage(httpError(429))).toMatch(/Muitas tentativas/);
    expect(errorMessage(httpError(400, { message: ['campo inválido'] }))).toBe('campo inválido');
    expect(errorMessage(httpError(409, { message: 'Registro duplicado' }))).toBe('Registro duplicado');
  });

  it('falls back to a generic or custom message', () => {
    expect(errorMessage(new Error('x'))).toMatch(/Não foi possível/);
    expect(errorMessage(httpError(500), 'Falhou')).toBe('Falhou');
  });
});

describe('storage utils', () => {
  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('round-trips a flag and falls back when it was never saved', () => {
    expect(readStoredFlag('cp.test')).toBe(false);
    expect(readStoredFlag('cp.test', true)).toBe(true);
    writeStoredFlag('cp.test', false);
    expect(readStoredFlag('cp.test', true)).toBe(false);
    writeStoredFlag('cp.test', true);
    expect(readStoredFlag('cp.test')).toBe(true);
  });

  it('survives unavailable storage', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('blocked'); });
    expect(readStoredFlag('cp.test', true)).toBe(true);
    expect(() => writeStoredFlag('cp.test', true)).not.toThrow();
  });
});

describe('SwipeTracker', () => {
  const touch = (x: number, y: number) => ({ changedTouches: [{ clientX: x, clientY: y }] }) as unknown as TouchEvent;
  const gesture = (from: [number, number], to: [number, number]) => {
    const tracker = new SwipeTracker();
    tracker.start(touch(...from));
    return tracker.end(touch(...to));
  };

  it('pages forward on a left swipe and back on a right swipe', () => {
    expect(gesture([200, 100], [120, 110])).toBe(1);
    expect(gesture([120, 100], [200, 90])).toBe(-1);
  });

  it('ignores short or mostly vertical gestures', () => {
    expect(gesture([200, 100], [180, 100])).toBe(0);
    expect(gesture([200, 100], [140, 220])).toBe(0);
  });
});
