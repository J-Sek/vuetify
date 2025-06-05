// Styles
import './VMaskInput.sass'

// Components
import { makeVTextFieldProps, VTextField } from '@/components/VTextField/VTextField'

// Composables
import { forwardRefs } from '@/composables/forwardRefs'
import { makeMaskProps, useMask } from '@/composables/mask'
import { useProxiedModel } from '@/composables/proxiedModel'

// Utilities
import { computed, onMounted, ref } from 'vue'
import { genericComponent, omit, propsFactory, useRender } from '@/util'

// Types
import type { VTextFieldSlots } from '@/components/VTextField/VTextField'

export type VMaskInputSlots = VTextFieldSlots

export const makeVMaskInputProps = propsFactory({
  ...makeVTextFieldProps(),
  ...makeMaskProps(),
}, 'VMaskInput')

export const VMaskInput = genericComponent<VMaskInputSlots>()({
  name: 'VMaskInput',

  props: makeVMaskInputProps(),

  emits: {
    'update:modelValue': (val: string) => true,
  },

  setup (props, { slots, attrs, emit }) {
    const vTextFieldRef = ref<VTextField>()

    const { maskText, updateRange, unmaskText, effectiveMask } = useMask(props, vTextFieldRef)
    const returnMaskedValue = computed(() => props.mask && props.returnMaskedValue)

    const model = useProxiedModel(
      props,
      'modelValue',
      undefined,
      // Always display masked value in input when mask is applied
      val => props.mask ? maskText(unmaskText(val)) : val,
      val => {
        if (props.mask) {
          const valueBeforeChange = unmaskText(model.value)
          // E.g. mask is #-# and the input value is '2-23'
          // model-value should be enforced to '2-2'
          const enforcedMaskedValue = maskText(unmaskText(val))
          const newUnmaskedValue = unmaskText(enforcedMaskedValue)

          if (newUnmaskedValue === valueBeforeChange) {
            vTextFieldRef.value!.value = enforcedMaskedValue
          }
          val = newUnmaskedValue
          updateRange()
          return returnMaskedValue.value ? maskText(val) : val
        }
        return val
      },
    )

    const remainingPattern = computed(() => {
      return effectiveMask.value
        ? effectiveMask.value.substring((model.value ?? '').length)
          .replaceAll('#', '_') // maybe a prop?
        : ''
    })

    onMounted(() => {
      if (props.returnMaskedValue) {
        emit('update:modelValue', model.value)
      }
    })

    useRender(() => {
      const textFieldProps = VTextField.filterProps(props)

      return (
        <VTextField
          { ...textFieldProps }
          { ...attrs }
          v-model={ model.value }
          ref={ vTextFieldRef }
        >
          {{
            default: slots.default ?? (() => !model.value ? '' : (
            <div class="v-mask-input-placeholder">
              <span class="v-mask-input-placeholder__input">{ model.value }</span>
              <span class="v-mask-input-placeholder__remaining">{ remainingPattern.value }</span>
            </div>
            )),
            ...omit(slots, ['default']),
          }}
        </VTextField>
      )
    })

    return forwardRefs({}, vTextFieldRef)
  },
})

export type VMaskInput = InstanceType<typeof VMaskInput>
