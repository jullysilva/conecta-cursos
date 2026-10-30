import { waitUntil } from '@vercel/functions';

/**
 * Runs work after the response is sent. On Vercel the function instance is kept alive
 * until the promise settles; on a long-running server the call is a no-op wrapper.
 */
export function runInBackground(task: Promise<unknown>): void {
  waitUntil(task);
}
