import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AnimationControls } from './animation-controls';
import { WaapiPlayer } from './waapi-player';
import { SpringPlayer } from './spring-player';
import { MoveKeyframes, MoveSpring } from '../presets/presets.types';
import { MovementConfig, MOVEMENT_CONFIG } from '../tokens/movement.tokens';

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
    options: PlayAnimationOptions = {}
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

    if (options.spring) {
      return new SpringPlayer(
        host,
        frames,
        options.spring,
        options.delay ?? this.#defaults.delay,
        options.onDone
      );
    } else {
      const config = options.config ?? this.#defaults;
      return new WaapiPlayer(
        host,
        frames,
        {
          duration: config.duration,
          easing: config.easing,
          delay: options.delay ?? config.delay,
          disabled: false
        },
        options.onDone
      );
    }
  }

  #applyFinalStyles(host: HTMLElement, frames: MoveKeyframes) {
    const getFinal = (arr: readonly number[] | undefined) => {
      if (!arr || arr.length === 0) return undefined;
      return arr[arr.length - 1];
    };

    const opacity = getFinal(frames.opacity);
    if (opacity !== undefined) host.style.opacity = `${opacity}`;

    const x = getFinal(frames.x);
    const y = getFinal(frames.y);
    if (x !== undefined || y !== undefined) {
      host.style.translate = `${x ?? 0}px ${y ?? 0}px`;
    }

    const scale = getFinal(frames.scale);
    if (scale !== undefined) {
      host.style.scale = `${scale}`;
    } else {
      const scaleX = getFinal(frames.scaleX);
      const scaleY = getFinal(frames.scaleY);
      if (scaleX !== undefined || scaleY !== undefined) {
        host.style.scale = `${scaleX ?? 1} ${scaleY ?? 1}`;
      }
    }

    const rotate = getFinal(frames.rotate);
    if (rotate !== undefined) {
      host.style.rotate = `${rotate}deg`;
    }

    const rotateX = getFinal(frames.rotateX);
    const rotateY = getFinal(frames.rotateY);
    if (rotateX !== undefined || rotateY !== undefined) {
      host.style.transform = `perspective(1200px) rotateX(${rotateX ?? 0}deg) rotateY(${rotateY ?? 0}deg)`;
    }
  }
}
