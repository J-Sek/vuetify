// Components
import { makeVDatePickerMonthProps, VDatePickerMonth } from '@/components/VDatePicker/VDatePickerMonth'
import { VVirtualScroll } from '@/components/VVirtualScroll'

// Composables
import { useDateRangeMonths } from './dateRangePicker'
import { useCalendar } from '@/composables/calendar'
import { computeColor } from '@/composables/color'
import { useDate } from '@/composables/date'
import { useProxiedModel } from '@/composables/proxiedModel'

// Utilities
import { genericComponent, noop, propsFactory, useRender } from '@/util'

export const VDateRangePickerMonths = genericComponent()({
  name: 'VDateRangePickerMonths',

  props: propsFactory({
    ...makeVDatePickerMonthProps(),
  }, 'VDateRangePickerMonths')(),

  emits: {
    'update:modelValue': (_value: unknown[]) => true,
    'update:month': (_value: number) => true,
    'update:year': (_value: number) => true,
    'update:previewValue': (_value: unknown) => true,
  },

  setup (props) {
    const adapter = useDate()
    const { model, weekdayLabels } = useCalendar(props)
    const preview = useProxiedModel(props, 'previewValue')
    const { months, virtualRef, monthRef, onBoundaryNavigate, onInteraction, onScroll } = useDateRangeMonths(props, model)

    function onUpdateModel (value: readonly unknown[]) {
      if (!props.readonly && !props.disabled) model.value = value
    }

    // Preview is only drawn while picking the range end; every write re-renders all mounted months
    function onUpdatePreview (value: unknown) {
      if (model.value.length === 1 || value === undefined) preview.value = value
    }

    // VBtn setup per day dominates the cost of mounting a month while scrolling, so days render plain VBtn markup
    function genDay ({ props: dayProps, item }: { props: Record<string, any>, item: { localized: string } }) {
      const { color, variant, disabled, readonly, icon, ripple, class: dayClass, ...attrs } = dayProps
      const colors = computeColor({ [['elevated', 'flat'].includes(variant) ? 'background' : 'text']: color })

      return (
        <button
          type="button"
          { ...attrs }
          class={[
            'v-btn v-btn--icon v-btn--density-default v-btn--size-default',
            `v-btn--variant-${variant}`,
            { 'v-btn--disabled': disabled, 'v-btn--readonly': readonly },
            colors.class,
            dayClass,
          ]}
          style={ colors.style }
          disabled={ disabled || undefined }
        >
          <span class="v-btn__overlay" />
          <span class="v-btn__underlay" />
          <span class="v-btn__content" data-no-activator="">{ item.localized }</span>
        </button>
      )
    }

    useRender(() => (
      <div class="v-date-range-picker__calendar">
        { !props.hideWeekdays && (
          <div
            key="weekdays"
            class="v-date-range-picker__weekdays"
            style={{ '--v-date-picker-days-in-week': props.weekdays.length }}
            aria-hidden="true"
          >
            { props.showWeek && (
              <div key="weeks" class="v-date-picker-month__weeks">
                <div class="v-date-picker-month__day">&nbsp;</div>
              </div>
            )}
            <div class="v-date-picker-month__days-row">
              { weekdayLabels.value.map(day => <div class="v-date-picker-month__day v-date-picker-month__weekday">{ day }</div>) }
            </div>
          </div>
        )}
        <VVirtualScroll
          ref={ virtualRef }
          class="v-date-range-picker__months"
          items={ months.value }
          itemKey="index"
          itemHeight={ 320 }
          buffer={ 640 }
          onScrollPassive={ onScroll }
          onWheelPassive={ onInteraction }
          onTouchstartPassive={ onInteraction }
          onPointerdown={ onInteraction }
          onKeydownCapture={ onInteraction }
        >
          {{
            default: ({ item }) => (
              <div class="v-date-range-picker__month">
                <div class="v-date-range-picker__month-title">{ adapter.format(item.date, 'monthAndYear') }</div>
                <VDatePickerMonth
                  { ...VDatePickerMonth.filterProps(props) }
                  ref={ monthRef(item.index) }
                  modelValue={ model.value }
                  onUpdate:modelValue={ onUpdateModel }
                  month={ item.month }
                  year={ item.year }
                  onUpdate:month={ noop }
                  onUpdate:year={ noop }
                  multiple="range"
                  noAutoNavigation
                  hideWeekdays
                  showAdjacentMonths={ false }
                  transition=""
                  previewValue={ preview.value }
                  onUpdate:previewValue={ onUpdatePreview }
                  onBoundaryNavigate={ onBoundaryNavigate }
                  v-slots={{ day: genDay }}
                />
              </div>
            ),
          }}
        </VVirtualScroll>
      </div>
    ))

    return {}
  },
})
