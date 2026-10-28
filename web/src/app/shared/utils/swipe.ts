/** Minimum horizontal travel, in px, for a touch gesture to count as a swipe. */
export const SWIPE_THRESHOLD_PX = 40;

/**
 * Turns a touch gesture into a paging step: 1 = next (swipe left), -1 = previous (swipe right),
 * 0 = too short or mostly vertical (the user is scrolling the page).
 */
export class SwipeTracker {
  private startX = 0;
  private startY = 0;

  start(event: TouchEvent): void {
    const touch = event.changedTouches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
  }

  end(event: TouchEvent): -1 | 0 | 1 {
    const touch = event.changedTouches[0];
    const dx = touch.clientX - this.startX;
    const dy = touch.clientY - this.startY;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) <= Math.abs(dy)) return 0;
    return dx < 0 ? 1 : -1;
  }
}
