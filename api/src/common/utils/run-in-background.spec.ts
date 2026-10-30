import { waitUntil } from '@vercel/functions';
import { runInBackground } from './run-in-background.js';

vi.mock('@vercel/functions', () => ({ waitUntil: vi.fn() }));

describe('runInBackground', () => {
  it('hands the task to waitUntil so a Vercel Function stays alive until it settles', () => {
    const task = Promise.resolve('sent');
    runInBackground(task);
    expect(waitUntil).toHaveBeenCalledWith(task);
  });
});
