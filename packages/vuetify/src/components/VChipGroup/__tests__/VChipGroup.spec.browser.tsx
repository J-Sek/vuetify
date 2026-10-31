import { VChipGroup } from '../VChipGroup'

// Components
import { VChip } from '@/components/VChip'

// Utilities
import { render, screen, userEvent } from '@test'
import { nextTick, shallowRef } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'

describe('VChipGroup', () => {
  it('should follow current route and keep state when navigation is cancelled', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/a', component: { template: '<div />' } },
        { path: '/b', component: { template: '<div />' } },
      ],
    })
    await router.push('/a')

    const model = shallowRef()
    let navigationLock = true
    router.beforeEach(() => !navigationLock)

    render(() => (
      <VChipGroup v-model={ model.value }>
        <VChip to="/a" value="a" text="A" />
        <VChip to="/b" value="b" text="B" />
      </VChipGroup>
    ), { global: { plugins: [router] } })

    await expect.poll(() => model.value).toBe('a')

    await userEvent.click(screen.getByText('B'))
    await nextTick()
    expect(model.value).toBe('a')
    expect(router.currentRoute.value.path).toBe('/a')

    navigationLock = false
    await userEvent.click(screen.getByText('B'))
    await expect.poll(() => model.value).toBe('b')
    expect(router.currentRoute.value.path).toBe('/b')

    await router.push('/a')
    await expect.poll(() => model.value).toBe('a')
  })
})
