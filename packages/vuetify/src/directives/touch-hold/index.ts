// Utilities
import { isFunction } from '@/util'

// Types
import type { DirectiveBinding } from 'vue'

export interface TouchHoldEvent {
  originalEvent: TouchEvent | MouseEvent
  target: HTMLElement
  clientX: number
  clientY: number
}

export interface TouchHoldOptions {
  handler: (e: TouchHoldEvent) => void
  duration?: number
}

export interface TouchHoldDirectiveBinding extends Omit<DirectiveBinding, 'value'> {
  value?: TouchHoldOptions['handler'] | TouchHoldOptions | null
}

export type TouchHold = ReturnType<typeof createTouchHold>

// iOS reads it before touchstart handlers run, so it cannot wait for the press
export function preventCallout (el: HTMLElement) {
  el.style.setProperty('-webkit-touch-callout', 'none')
}

const lockedStyles = ['-webkit-user-select', 'user-select']

function lockStyles (el: HTMLElement) {
  const prev = lockedStyles.map(p => el.style.getPropertyValue(p))
  lockedStyles.forEach(p => el.style.setProperty(p, 'none'))
  return () => lockedStyles.forEach((p, i) => prev[i] ? el.style.setProperty(p, prev[i]) : el.style.removeProperty(p))
}

// nested holds share one touchstart; the innermost one takes it
const claimed = new WeakSet<Event>()

export function createTouchHold (options: TouchHoldOptions) {
  let timer = -1
  let handling = false
  let press: { el: HTMLElement, target: EventTarget, x: number, y: number, unlock: () => void } | undefined

  const state = {
    options,
    held: false,
    get pressing () {
      return !!press
    },
    onTouchstart,
    cancel: () => end(),
  }

  function onTouchstart (e: TouchEvent) {
    end()
    state.held = false
    if (e.touches.length > 1 || claimed.has(e)) return
    claimed.add(e)

    const el = e.currentTarget as HTMLElement
    const { clientX, clientY } = e.touches[0]
    // touch events keep targeting the original node even after it leaves the DOM, where they no longer bubble to el
    const target = e.target!
    press = { el, target, x: clientX, y: clientY, unlock: lockStyles(el) }
    target.addEventListener('touchmove', onTouchmove as EventListener, { passive: true })
    target.addEventListener('touchend', onTouchend as EventListener, { passive: false })
    target.addEventListener('touchcancel', onTouchend as EventListener)
    window.addEventListener('contextmenu', onContextmenu, { capture: true })

    timer = window.setTimeout(() => trigger(e), state.options.duration ?? 500)
  }

  function trigger (originalEvent: TouchEvent | MouseEvent) {
    clearTimeout(timer)
    state.held = true
    getSelection()?.removeAllRanges()
    handling = true
    try {
      state.options.handler({ originalEvent, target: press!.el, clientX: press!.x, clientY: press!.y })
    } finally {
      handling = false
    }
  }

  function onTouchmove (e: TouchEvent) {
    if (!press || state.held) return
    const { clientX, clientY } = e.touches[0]
    // fingers drift while holding still
    if (e.touches.length > 1 || Math.hypot(clientX - press.x, clientY - press.y) > 10) end()
  }

  function onTouchend (e: TouchEvent) {
    // cancels the click (and emulated mouse events) that would follow the hold
    if (state.held && e.cancelable) e.preventDefault()
    end()
  }

  // Android fires contextmenu for the long-press; letting it propagate closes what the handler opened via click-outside
  function onContextmenu (e: MouseEvent) {
    if (handling || !press?.el.contains(e.target as Node)) return
    e.preventDefault()
    e.stopImmediatePropagation()
    if (!state.held) trigger(e)
  }

  function end () {
    clearTimeout(timer)
    if (!press) return

    const { target, unlock } = press
    press = undefined
    target.removeEventListener('touchmove', onTouchmove as EventListener)
    target.removeEventListener('touchend', onTouchend as EventListener)
    target.removeEventListener('touchcancel', onTouchend as EventListener)
    window.removeEventListener('contextmenu', onContextmenu, { capture: true })
    // restoring right away still lets the finger lift start a selection
    if (state.held) setTimeout(unlock, 10)
    else unlock()
  }

  return state
}

function normalize (value: NonNullable<TouchHoldDirectiveBinding['value']>): TouchHoldOptions {
  return isFunction(value) ? { handler: value } : value
}

function mounted (el: HTMLElement, binding: TouchHoldDirectiveBinding) {
  const uid = binding.instance?.$.uid
  if (!binding.value || uid === undefined) return

  const hold = createTouchHold(normalize(binding.value))
  preventCallout(el)
  el._touchHold ??= Object.create(null)
  el._touchHold![uid] = hold
  el.addEventListener('touchstart', hold.onTouchstart, { passive: true })
}

function unmounted (el: HTMLElement, binding: TouchHoldDirectiveBinding) {
  const uid = binding.instance?.$.uid
  const hold = uid === undefined ? undefined : el._touchHold?.[uid]
  if (!hold) return

  hold.cancel()
  el.removeEventListener('touchstart', hold.onTouchstart)
  delete el._touchHold![uid!]
}

function updated (el: HTMLElement, binding: TouchHoldDirectiveBinding) {
  const uid = binding.instance?.$.uid
  const hold = uid === undefined ? undefined : el._touchHold?.[uid]

  if (!binding.value) unmounted(el, binding)
  // inline handlers change on every render, which must not cancel a press in progress
  else if (hold) hold.options = normalize(binding.value)
  else mounted(el, binding)
}

export const TouchHold = {
  mounted,
  unmounted,
  updated,
}

export default TouchHold
