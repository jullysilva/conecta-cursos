import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import type { VideoProvider } from '../../core/models/models';
import { embedUrl } from '../utils/video';

const REPORT_EVERY_SEC = 10;

/**
 * Plays direct video files natively (with position tracking) and
 * YouTube/Vimeo/Panda through their embed players.
 */
@Component({
  selector: 'cp-video-player',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (provider() === 'URL') {
      @if (videoRef()) {
        <video
          #video
          controls
          preload="metadata"
          [src]="videoRef()"
          [attr.aria-label]="title()"
          (loadedmetadata)="resume()"
          (timeupdate)="onTimeUpdate()"
          (pause)="report()"
          (ended)="ended.emit()"
        ></video>
      } @else {
        <p class="placeholder">Esta aula ainda não tem vídeo.</p>
      }
    } @else if (safeEmbed(); as src) {
      <iframe
        [src]="src"
        [title]="title()"
        allow="accelerometer; autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowfullscreen
      ></iframe>
    } @else {
      <p class="placeholder">O endereço do vídeo desta aula é inválido.</p>
    }
  `,
  styles: `
    :host { display: block; aspect-ratio: 16 / 9; background: #0f1a24; border-radius: var(--radius-md); overflow: hidden; }
    video, iframe { width: 100%; height: 100%; border: 0; display: block; background: #000; }
    .placeholder { height: 100%; display: grid; place-items: center; color: #c9d3da; }
  `,
})
export class VideoPlayer {
  private readonly sanitizer = inject(DomSanitizer);

  readonly provider = input.required<VideoProvider>();
  readonly videoRef = input.required<string>();
  readonly title = input('Vídeo da aula');
  readonly startAt = input(0);
  readonly positionChange = output<number>();
  readonly ended = output<void>();

  private readonly video = viewChild<ElementRef<HTMLVideoElement>>('video');
  private lastReported = 0;

  protected readonly safeEmbed = computed(() => {
    const url = embedUrl(this.provider(), this.videoRef(), this.startAt());
    // Only URLs built by embedUrl() for known providers reach the iframe.
    return url ? this.sanitizer.bypassSecurityTrustResourceUrl(url) : null;
  });

  /** Current playback position, for saving on navigation/close. */
  currentTime(): number {
    return this.video()?.nativeElement.currentTime ?? 0;
  }

  protected resume(): void {
    const element = this.video()?.nativeElement;
    if (element && this.startAt() > 0 && this.startAt() < element.duration - 5) {
      element.currentTime = this.startAt();
    }
    this.lastReported = this.startAt();
  }

  protected onTimeUpdate(): void {
    if (Math.abs(this.currentTime() - this.lastReported) >= REPORT_EVERY_SEC) this.report();
  }

  protected report(): void {
    this.lastReported = this.currentTime();
    this.positionChange.emit(this.lastReported);
  }
}
