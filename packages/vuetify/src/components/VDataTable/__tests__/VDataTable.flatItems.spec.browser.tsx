// Components
import { VDataTable } from '..'

// Utilities
import { render } from '@test'
import { ref } from 'vue'

const DESSERT_HEADERS = [
  { title: 'Dessert', key: 'name' },
  { title: 'Calories', key: 'calories' },
  { title: 'Category', key: 'category' },
]

const DESSERT_ITEMS = [
  { name: 'Frozen Yogurt', calories: 159, category: 'Dairy' },
  { name: 'Ice cream sandwich', calories: 237, category: 'Dairy' },
  { name: 'Eclair', calories: 262, category: 'Pastry' },
  { name: 'Cupcake', calories: 305, category: 'Pastry' },
  { name: 'Gingerbread', calories: 356, category: 'Cookie' },
  { name: 'Jelly bean', calories: 375, category: 'Candy' },
]

const names = (items: readonly any[]) =>
  items.filter(i => i.type === 'item').map(i => i.raw.name)

describe('VDataTable flatItems', () => {
  it('exposes every filtered + sorted item regardless of pagination', () => {
    const table = ref<any>()

    render(() => (
      <VDataTable
        ref={ table }
        items={ DESSERT_ITEMS }
        headers={ DESSERT_HEADERS }
        sortBy={[{ key: 'name', order: 'asc' }]}
        itemsPerPage={ 2 }
      />
    ))

    // page 1 shows 2 rows, but flatItems holds all 6, in sorted order
    expect(names(table.value.flatItems)).toStrictEqual([
      'Cupcake', 'Eclair', 'Frozen Yogurt', 'Gingerbread', 'Ice cream sandwich', 'Jelly bean',
    ])
  })

  it('narrows to the filtered subset', () => {
    const table = ref<any>()

    render(() => (
      <VDataTable
        ref={ table }
        items={ DESSERT_ITEMS }
        headers={ DESSERT_HEADERS }
        search="Dairy"
        itemsPerPage={ 1 }
      />
    ))

    expect(names(table.value.flatItems).sort()).toStrictEqual(['Frozen Yogurt', 'Ice cream sandwich'])
  })

  it('interleaves group headers and keeps every record when grouping', () => {
    const table = ref<any>()

    render(() => (
      <VDataTable
        ref={ table }
        items={ DESSERT_ITEMS }
        headers={ DESSERT_HEADERS }
        groupBy={[{ key: 'category' }]}
        openAll
        itemsPerPage={ 2 }
      />
    ))

    const flat = table.value.flatItems
    // 4 group headers present even though the page renders only 2 groups
    expect(flat.filter((i: any) => i.type === 'group')).toHaveLength(4)
    // flatMapping the leaf records recovers all 6 source rows
    expect(names(flat).sort()).toStrictEqual(
      DESSERT_ITEMS.map(i => i.name).sort()
    )
  })
})
