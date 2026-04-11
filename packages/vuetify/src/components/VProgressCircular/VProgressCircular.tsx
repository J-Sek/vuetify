// Styles
import './VProgressCircular.sass'

// Composables
import { useTextColor } from '@/composables/color'
import { makeComponentProps } from '@/composables/component'
import { useIntersectionObserver } from '@/composables/intersectionObserver'
import { useResizeObserver } from '@/composables/resizeObserver'
import { makeRevealProps, useReveal } from '@/composables/reveal'
import { makeSizeProps, useSize } from '@/composables/size'
import { makeTagProps } from '@/composables/tag'
import { makeThemeProps, provideTheme } from '@/composables/theme'

// Utilities
import { computed, ref, shallowRef, toRef, watchEffect } from 'vue'
import { clamp, convertToUnit, genericComponent, PREFERS_REDUCED_MOTION, propsFactory, useRender } from '@/util'

// Types
import type { PropType } from 'vue'

export const makeVProgressCircularProps = propsFactory({
  bgColor: String,
  color: String,
  indeterminate: [Boolean, String] as PropType<boolean | 'disable-shrink'>,
  rounded: Boolean,
  modelValue: {
    type: [Number, String],
    default: 0,
  },
  rotate: {
    type: [Number, String],
    default: 0,
  },
  width: {
    type: [Number, String],
    default: 4,
  },

  ...makeComponentProps(),
  ...makeRevealProps(),
  ...makeSizeProps({ size: 30 }),
  ...makeTagProps({ tag: 'div' }),
  ...makeThemeProps(),
}, 'VProgressCircular')

type VProgressCircularSlots = {
  default: { value: number }
}

export const VProgressCircular = genericComponent<VProgressCircularSlots>()({
  name: 'VProgressCircular',

  props: makeVProgressCircularProps(),

  setup (props, { slots }) {
    const MAGIC_RADIUS_CONSTANT = 20
    const CIRCUMFERENCE = 2 * Math.PI * MAGIC_RADIUS_CONSTANT

    const root = ref<HTMLElement>()
    const svgRef = ref<SVGSVGElement>()
    const overlayRef = ref<SVGCircleElement>()
    const indeterminateAnimations = shallowRef<Animation[]>([])

    const { themeClasses } = provideTheme(props)
    const { sizeClasses, sizeStyles } = useSize(props)
    const { textColorClasses, textColorStyles } = useTextColor(() => props.color)
    const { textColorClasses: underlayColorClasses, textColorStyles: underlayColorStyles } = useTextColor(() => props.bgColor)
    const { intersectionRef, isIntersecting } = useIntersectionObserver()
    const { resizeRef, contentRect } = useResizeObserver()
    const { state: revealState, duration: revealDuration } = useReveal(props)

    const normalizedValue = toRef(() => revealState.value === 'initial' ? 0 : clamp(parseFloat(props.modelValue), 0, 100))
    const width = toRef(() => Number(props.width))
    const size = toRef(() => {
      // Get size from element if size prop value is small, large etc
      return sizeStyles.value
        ? Number(props.size)
        : contentRect.value
          ? contentRect.value.width
          : Math.max(width.value, 32)
    })
    const diameter = toRef(() => (MAGIC_RADIUS_CONSTANT / (1 - width.value / size.value)) * 2)
    const strokeWidth = toRef(() => width.value / size.value * diameter.value)
    const strokeDashOffset = toRef(() => {
      const baseLength = ((100 - normalizedValue.value) / 100) * CIRCUMFERENCE
      return props.rounded && normalizedValue.value > 0 && normalizedValue.value < 100
        ? convertToUnit(Math.min(CIRCUMFERENCE - 0.01, baseLength + strokeWidth.value))
        : convertToUnit(baseLength)
    })
    const startAngle = computed(() => {
      const baseAngle = Number(props.rotate)
      return props.rounded
        ? baseAngle + (strokeWidth.value / 2) / CIRCUMFERENCE * 360
        : baseAngle
    })

    watchEffect(() => {
      intersectionRef.value = root.value
      resizeRef.value = root.value
    })

    // Indeterminate animations (WAAPI)
    watchEffect((onCleanup) => {
      const svg = svgRef.value
      const overlay = overlayRef.value

      if (!props.indeterminate || !svg || !overlay) {
        indeterminateAnimations.value = []
        return
      }

      const disableShrink = props.indeterminate === 'disable-shrink' || PREFERS_REDUCED_MOTION()
      const anims: Animation[] = []

      anims.push(svg.animate(
        [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }],
        { duration: disableShrink ? 700 : 1400, iterations: Infinity, easing: 'linear', composite: 'add' }
      ))

      if (!disableShrink) {
        anims.push(overlay.animate(
          [{ transform: 'rotate(-90deg)' }, { transform: 'rotate(270deg)' }],
          { duration: 1400, iterations: Infinity, easing: 'linear' }
        ))

        anims.push(overlay.animate(
          [
            { strokeDasharray: '1, 200', strokeDashoffset: '0px' },
            { strokeDasharray: '100, 200', strokeDashoffset: '-15px', offset: 0.5 },
            { strokeDasharray: '100, 200', strokeDashoffset: '-124px' },
          ],
          { duration: 1400, iterations: Infinity, easing: 'ease-in-out' }
        ))
      }

      anims.forEach(a => a.pause())
      indeterminateAnimations.value = anims

      onCleanup(() => anims.forEach(a => a.cancel()))
    })

    // Control playback based on visibility
    watchEffect(() => {
      for (const anim of indeterminateAnimations.value) {
        if (isIntersecting.value) {
          if (anim.playState !== 'running') anim.play()
        } else {
          anim.pause()
        }
      }
    })

    useRender(() => (
      <props.tag
        ref={ root }
        class={[
          'v-progress-circular',
          {
            'v-progress-circular--indeterminate': !!props.indeterminate,
            'v-progress-circular--visible': isIntersecting.value,
            'v-progress-circular--disable-shrink': props.indeterminate &&
              (props.indeterminate === 'disable-shrink' || PREFERS_REDUCED_MOTION()),
            'v-progress-circular--revealing': ['initial', 'pending'].includes(revealState.value),
          },
          themeClasses.value,
          sizeClasses.value,
          textColorClasses.value,
          props.class,
        ]}
        style={[
          sizeStyles.value,
          textColorStyles.value,
          {
            '--progress-reveal-duration': `${revealDuration.value}ms`,
          },
          props.style,
        ]}
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={ props.indeterminate ? undefined : normalizedValue.value }
      >
        <svg
          ref={ svgRef }
          style={{
            transform: `rotate(calc(-90deg + ${startAngle.value}deg))`,
          }}
          xmlns="http://www.w3.org/2000/svg"
          viewBox={ `0 0 ${diameter.value} ${diameter.value}` }
        >
          <circle
            class={[
              'v-progress-circular__underlay',
              underlayColorClasses.value,
            ]}
            style={ underlayColorStyles.value }
            fill="transparent"
            cx="50%"
            cy="50%"
            r={ MAGIC_RADIUS_CONSTANT }
            stroke-width={ strokeWidth.value }
            stroke-dasharray={ CIRCUMFERENCE }
            stroke-dashoffset={ 0 }
          />

          <circle
            ref={ overlayRef }
            class="v-progress-circular__overlay"
            fill="transparent"
            cx="50%"
            cy="50%"
            r={ MAGIC_RADIUS_CONSTANT }
            stroke-width={ strokeWidth.value }
            stroke-dasharray={ CIRCUMFERENCE }
            stroke-dashoffset={ strokeDashOffset.value }
            stroke-linecap={ props.rounded ? 'round' : undefined }
          />
        </svg>

        { slots.default && (
          <div class="v-progress-circular__content">
            { slots.default({ value: normalizedValue.value }) }
          </div>
        )}
      </props.tag>
    ))

    return {}
  },
})

export type VProgressCircular = InstanceType<typeof VProgressCircular>
