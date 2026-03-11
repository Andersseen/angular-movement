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
  private platformId = inject(PLATFORM_ID);
  private defaults = inject(MOVEMENT_CONFIG);

  play(
    host: HTMLElement,
    frames: MoveKeyframes,
    options: PlayAnimationOptions = {}
  ): AnimationControls | null {
    if (!isPlatformBrowser(this.platformId)) {
      options.onDone?.();
      return null;
    }

    if (options.disabled) {
      this.applyFinalStyles(host, frames);
      options.onDone?.();
      return null;
    }

    if (options.spring) {
      return new SpringPlayer(
        host,
        frames,
        options.spring,
        options.delay ?? this.defaults.delay,
        options.onDone
      );
    } else {
      const config = options.config ?? this.defaults;
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

  private applyFinalStyles(host: HTMLElement, frames: MoveKeyframes) {
    const getFinal = (arr: readonly number[] | undefined) => {
      if (!arr || arr.length === 0) return undefined;
      return arr[arr.length - 1];
    };

    const opacity = getFinal(frames.opacity);
    if (opacity !== undefined) host.style.opacity = `${opacity}`;

    const transforms: string[] = [];
    
    const x = getFinal(frames.x);
    if (x !== undefined) transforms.push(`translateX(${x}px)`);

    const y = getFinal(frames.y);
    if (y !== undefined) transforms.push(`translateY(${y}px)`);

    const scale = getFinal(frames.scale);
    if (scale !== undefined) transforms.push(`scale(${scale})`);

    const rotate = getFinal(frames.rotate);
    if (rotate !== undefined) transforms.push(`rotate(${rotate}deg)`);

    const rotateX = getFinal(frames.rotateX);
    if (rotateX !== undefined) transforms.push(`rotateX(${rotateX}deg)`);

    const rotateY = getFinal(frames.rotateY);
    if (rotateY !== undefined) transforms.push(`rotateY(${rotateY}deg)`);

    if (transforms.length > 0) {
      host.style.transform = transforms.join(' ');
    }
  }
}
