<script setup lang="ts">
import IconSelector from '@/components/IconSelector.vue'
import { useWorkspace } from '@/store'
import { ScalarButton } from '@scalar/components'
import { LibraryIcon } from '@scalar/icons'
import { useToasts } from '@scalar/use-toasts'
import { ref } from 'vue'

import CommandActionForm from './CommandActionForm.vue'
import CommandActionInput from './CommandActionInput.vue'

const emits = defineEmits<{
  (event: 'close'): void
}>()

const { activeWorkspace, collectionMutators } = useWorkspace()
const collectionName = ref('')
const collectionIcon = ref('interface-content-folder')
const { toast } = useToasts()

const handleSubmit = () => {
  if (!collectionName.value) {
    toast('Please enter a name before creating a collection.', 'error')
    return
  }

  collectionMutators.add(
    {
      'openapi': '3.1.0',
      'info': {
        title: collectionName.value,
        version: '0.0.1',
      },
      'x-scalar-icon': collectionIcon.value,
    },
    activeWorkspace.value.uid,
  )
  emits('close')
}
</script>
<template>
  <CommandActionForm
    :disabled="!collectionName.trim()"
    @submit="handleSubmit">
    <CommandActionInput
      v-model="collectionName"
      label="Collection Name"
      placeholder="Collection Name" />
    <template #options>
      <IconSelector
        v-model="collectionIcon"
        placement="bottom-start">
        <ScalarButton
          class="aspect-square px-0 h-auto"
          variant="outlined">
          <LibraryIcon
            class="size-4 text-c-2 stroke-2"
            :src="collectionIcon" />
        </ScalarButton>
      </IconSelector>
    </template>
    <template #submit>Create Collection</template>
  </CommandActionForm>
</template>
