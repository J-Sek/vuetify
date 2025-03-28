// Utilities
import { computed, ref, toValue, watch } from 'vue'
import { clamp } from '@/util'

// Types
import type { MaybeRefOrGetter, Ref } from 'vue'

export const standardEasing = 'cubic-bezier(0.4, 0, 0.2, 1)'
export const deceleratedEasing = 'cubic-bezier(0.0, 0, 0.2, 1)' // Entering
export const acceleratedEasing = 'cubic-bezier(0.4, 0, 1, 1)' // Leaving

export type EasingFunction = (n: number) => number

export const easingPatterns: Record<string, EasingFunction> = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t ** 2,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t ** 2 : -1 + (4 - 2 * t) * t),
  easeInCubic: (t: number) => t ** 3,
  easeOutCubic: (t: number) => --t ** 3 + 1,
  easeInOutCubic: (t: number) => t < 0.5 ? 4 * t ** 3 : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInQuart: (t: number) => t ** 4,
  easeOutQuart: (t: number) => 1 - --t ** 4,
  easeInOutQuart: (t: number) => (t < 0.5 ? 8 * t ** 4 : 1 - 8 * --t ** 4),
  easeInQuint: (t: number) => t ** 5,
  easeOutQuint: (t: number) => 1 + --t ** 5,
  easeInOutQuint: (t: number) => t < 0.5 ? 16 * t ** 5 : 1 + 16 * --t ** 5,
}

export type EasingOptions = {
  duration?: number
  transition?: EasingFunction
}

type InternalEasingOptions = {
  duration: number
  transition: EasingFunction
}

export function useTransition (source: MaybeRefOrGetter<number>, options: EasingOptions) {
  const definedOptions: InternalEasingOptions = {
    duration: 300,
    transition: easingPatterns.easeInOutCubic,
    ...options,
  }

  const raf: ReturnType<typeof requestAnimationFrame> = null!
  const outputRef = ref(toValue(source))

  watch(() => toValue(source), async to => {
    cancelAnimationFrame(raf)
    await executeTransition(outputRef, outputRef.value, to, definedOptions)
  })

  return computed(() => outputRef.value)
}

function executeTransition (out: Ref<number>, from: number, to: number, options: InternalEasingOptions) {
  const startTime = performance.now()
  const ease = options.transition ?? easingPatterns.easeInOutCubic

  return new Promise<void>(resolve => requestAnimationFrame(function step (currentTime: number) {
    const timeElapsed = currentTime - startTime
    const progress = timeElapsed / options.duration
    out.value = from + (to - from) * ease(clamp(progress, 0, 1))

    if (progress < 1) {
      requestAnimationFrame(step)
    } else {
      out.value = to
      resolve()
    }
  }))
}
