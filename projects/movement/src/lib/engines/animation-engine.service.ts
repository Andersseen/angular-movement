import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AnimationControls } from './animation-controls';
import { WaapiPlayer } from './waapi-player';
import { SpringPlayer } from './spring-player';
import { MoveKeyframes, MoveSpring } from '../presets/presets.types';
import { MovementConfig, MOVEMENT_CONFIG } from '../tokens/movement.tokens';
import { applyComposedStyle, composeFinalStyle } from './keyframe-composer';

export interface PlayAnimationOptions {
  config?: MovementConfig;
  spring?: MoveSpring;
  delay?: number;
  disabled?: boolean;
  onDone?: () => void;
}

@Injectable({ providedIn: 'root' })
export class AnimationEngine {
  #platformId = inject(PLATFORM_ID);
  #defaults = inject(MOVEMENT_CONFIG);

  play(
    host: HTMLElement,
    frames: MoveKeyframes,
    options: PlayAnimationOptions = {},
  ): AnimationControls | null {
    if (!isPlatformBrowser(this.#platformId)) {
      options.onDone?.();
      return null;
    }

    if (options.disabled) {
      this.#applyFinalStyles(host, frames);
      options.onDone?.();
      return null;
    }

    const config = options.config ?? this.#defaults;
    const isSpring = options.spring || config.easing === 'spring';

    if (isSpring) {
      return new SpringPlayer(
        host,
        frames,
        options.spring ?? {},
        options.delay ?? config.delay,
        options.onDone,
      );
    } else {
      return new WaapiPlayer(
        host,
        frames,
        {
          duration: config.duration,
          easing: config.easing,
          delay: options.delay ?? config.delay,
          disabled: false,
        },
        options.onDone,
      );
    }
  }

  #applyFinalStyles(host: HTMLElement, frames: MoveKeyframes): void {
    applyComposedStyle(host, composeFinalStyle(frames));
  }
}
