import { Directive, ElementRef, inject, input, OnDestroy, OnInit, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MoveKeyframes } from '../presets/presets.types';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

@Directive({
  selector: '[moveScroll]',
  exportAs: 'moveScroll',
})
export class MoveScrollDirective implements OnInit, OnDestroy {
  readonly moveScroll = input<MoveKeyframes | undefined>(undefined);
  readonly moveScrollOffset = input<[string, string]>(['0 1', '1 0']);

  readonly progress = signal(0);

  private readonly documentRef = inject(DOCUMENT);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly engine = inject(AnimationEngine);

  private player: AnimationControls | null = null;
  private observer: IntersectionObserver | null = null;
  private scrollListener = () => this.updateProgress();

  ngOnInit() {
    const frames = this.moveScroll();
    if (frames) {
      this.player = this.engine.play(this.host.nativeElement, frames, {
        config: { duration: 1000, delay: 0, easing: 'linear', disabled: false },
      });
      this.player?.pause();
      if (this.player) {
        this.player.currentTime = 0;
      }
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          window.addEventListener('scroll', this.scrollListener, { passive: true });
          this.updateProgress();
        } else {
          window.removeEventListener('scroll', this.scrollListener);
        }
      },
      { root: null }
    );

    this.observer.observe(this.host.nativeElement);
  }

  private updateProgress() {
    const el = this.host.nativeElement;
    const rect = el.getBoundingClientRect();
    const windowHeight = window.innerHeight;

    const offsets = this.moveScrollOffset();
    const startY = this.calculateOffset(rect, windowHeight, offsets[0]);
    const endY = this.calculateOffset(rect, windowHeight, offsets[1]);

    const totalDistance = startY - endY;
    if (totalDistance === 0) return;

    let p = startY / totalDistance;
    p = Math.max(0, Math.min(1, p));

    this.progress.set(p);

    if (this.player) {
      this.player.currentTime = p * 1000;
    }
  }

  private calculateOffset(rect: DOMRect, windowHeight: number, offsetStr: string): number {
    const parts = offsetStr.split(' ');
    const elVal = parseFloat(parts[0]);
    const viewVal = parseFloat(parts[1]);

    return rect.top + rect.height * elVal - windowHeight * viewVal;
  }

  ngOnDestroy() {
    this.player?.cancel();
    window.removeEventListener('scroll', this.scrollListener);
    this.observer?.disconnect();
  }
}
