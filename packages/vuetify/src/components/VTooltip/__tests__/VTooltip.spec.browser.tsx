// Components
import { VTooltip } from '../VTooltip'
import { VBtn } from '@/components/VBtn'
import { VList, VListItem } from '@/components/VList'
import { VMenu } from '@/components/VMenu'

// Utilities
import { render, screen, touch, userEvent, wait } from '@test'
import { nextTick } from 'vue'

describe('VTooltip', () => {
  it('should not focus the activator after closing on mouseleave', async () => {
    render(() => (
      <VList>
        <VListItem data-testid="item" link title="Item">
          <VTooltip activator="parent" openDelay={ 0 } closeDelay={ 0 }>Tooltip</VTooltip>
        </VListItem>
        <VListItem link title="Other" data-testid="other" />
      </VList>
    ))

    const item = screen.getByTestId('item')
    await userEvent.hover(item)
    await expect.poll(() => screen.queryByCSS('.v-tooltip .v-overlay__content')).toBeVisible()

    await userEvent.unhover(item)
    await wait(100)

    expect(screen.queryByCSS('.v-tooltip .v-overlay__content')).not.toBeVisible()
    expect(document.activeElement).not.toBe(item)
  })

  it('should not focus the activator after closing on mouseleave while another menu is open', async () => {
    render(() => (
      <div>
        <VBtn data-testid="tooltip-btn">
          Hover me
          <VTooltip activator="parent" openDelay={ 0 } closeDelay={ 0 }>Tooltip</VTooltip>
        </VBtn>
        <VBtn data-testid="menu-btn">
          Open menu
          <VMenu activator="parent">
            <VList>
              <VListItem link title="Item" />
            </VList>
          </VMenu>
        </VBtn>
      </div>
    ))

    await userEvent.click(screen.getByTestId('menu-btn'))
    await expect.poll(() => screen.queryByCSS('.v-menu .v-overlay__content')).toBeVisible()

    const tooltipBtn = screen.getByTestId('tooltip-btn')
    await userEvent.hover(tooltipBtn)
    await expect.poll(() => screen.queryByCSS('.v-tooltip .v-overlay__content')).toBeVisible()

    await userEvent.unhover(tooltipBtn)
    await wait(100)

    expect(screen.queryByCSS('.v-tooltip .v-overlay__content')).not.toBeVisible()
    expect(document.activeElement).not.toBe(tooltipBtn)
    // the menu should remain open
    expect(screen.queryByCSS('.v-menu .v-overlay__content')).toBeVisible()
  })

  it('should open on touch-hold instead of tap and close on tap outside', async () => {
    render(() => (
      <div>
        <VBtn data-testid="btn">
          Hold me
          <VTooltip activator="parent" openOnTouchHold>Tooltip</VTooltip>
        </VBtn>
        <VBtn data-testid="other">Other</VBtn>
      </div>
    ))

    const btn = screen.getByTestId('btn')
    const content = () => screen.queryByCSS('.v-tooltip .v-overlay__content')
    await nextTick()

    // a tap, followed by the mouse events the browser emulates for it
    btn.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'touch' }))
    touch(btn).start(10, 10).end(10, 10)
    btn.dispatchEvent(new MouseEvent('mouseenter'))
    await wait(600)
    expect(content()).not.toBeVisible()

    touch(btn).start(10, 10)
    await expect.poll(content).toBeVisible()
    touch(btn).end(10, 10)
    await wait(600)
    expect(content()).toBeVisible()

    await userEvent.click(screen.getByTestId('other'))
    await expect.poll(content).not.toBeVisible()
  })

  it('should stay open when the browser fires contextmenu during the touch-hold', async () => {
    render(() => (
      <VBtn data-testid="btn">
        Hold me
        <VTooltip activator="parent" openOnTouchHold>Tooltip</VTooltip>
      </VBtn>
    ))

    const btn = screen.getByTestId('btn')
    const content = () => screen.queryByCSS('.v-tooltip .v-overlay__content')
    await nextTick()

    touch(btn).start(10, 10)
    await wait(200)
    // a real event: the browser flushes microtasks between listeners, which script-dispatched events skip
    await userEvent.click(btn, { button: 'right' })
    await wait(600)
    touch(btn).end(10, 10)

    expect(content()).toBeVisible()
  })
})
