<script setup lang="ts">
import Request from '@/assets/ascii/request.ascii?raw'
import HttpMethod from '@/components/HttpMethod/HttpMethod.vue'
import ScalarAsciiArt from '@/components/ScalarAsciiArt.vue'
import { useWorkspace } from '@/store/workspace'
import { ScalarButton, ScalarIcon, ScalarListbox } from '@scalar/components'
import { createRequest } from '@scalar/oas-utils/entities/workspace/spec'
import type { RequestMethod } from '@scalar/oas-utils/helpers'
import { nanoid } from 'nanoid'
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

defineProps<{
  title: string
}>()

const emits = defineEmits<{
  (event: 'close'): void
}>()

const { push } = useRouter()

const { requestMutators, collectionMutators, activeCollection } = useWorkspace()
const requestName = ref('')
const requestMethod = ref('GET')
const selectedFolderId = ref('')

const folders = computed(() => {
  if (!activeCollection.value) return []
  return Object.values(activeCollection.value.folders).map((folder) => ({
    id: folder.uid,
    label: folder.name,
  }))
})

const selectedFolder = computed({
  get: () => folders.value.find(({ id }) => id === selectedFolderId.value),
  set: (opt) => {
    if (opt?.id) selectedFolderId.value = opt.id
  },
})

function handleChangeMethod(method: string) {
  requestMethod.value = method
}

function handleSubmit() {
  if (!activeCollection.value) return

  const newRequest = createRequest({
    uid: nanoid(),
    path: '',
    method: requestMethod.value.toUpperCase() as RequestMethod,
    description: requestName.value,
    operationId: requestName.value,
    summary: requestName.value,
    tags: ['default'],
  })

  requestMutators.add(newRequest)
  collectionMutators.edit(
    activeCollection.value.uid,
    'requests',
    activeCollection.value.requests.concat(newRequest.uid),
  )

  const folderUid = selectedFolderId.value
  if (folderUid) {
    const folder = activeCollection.value.folders[folderUid]
    folder.children.push(newRequest.uid)
  } else {
    // If no folder is selected, add to the root of the collection
    collectionMutators.edit(
      activeCollection.value.uid,
      'requests',
      activeCollection.value.requests.concat(newRequest.uid),
    )
  }

  push(`/request/${newRequest.uid}`)

  emits('close')
}
</script>
<template>
  <ScalarAsciiArt :art="Request" />
  <h2>{{ title }}</h2>
  <form
    class="flex w-full flex-col gap-3"
    @submit.prevent="handleSubmit">
    <div class="flex min-h-10 gap-3 rounded border p-1">
      <HttpMethod
        :isEditable="true"
        isSquare
        :method="requestMethod"
        @change="handleChangeMethod" />
      <input
        v-model="requestName"
        label="Request Name"
        placeholder="Request Name" />
    </div>
    <div>
      <span class="mb-1 block font-medium">Inside:</span>
      <ScalarListbox
        v-model="selectedFolder"
        :options="folders"
        resize>
        <button
          class="relative flex h-full min-h-10 w-full cursor-pointer items-center justify-between rounded border p-2"
          type="button">
          <span :class="selectedFolder ? 'text-c-1' : 'text-c-3'">{{
            selectedFolder ? selectedFolder.label : 'Select Folder'
          }}</span>
          <ScalarIcon
            icon="ChevronDown"
            size="xs" />
        </button>
      </ScalarListbox>
    </div>
    <ScalarButton type="submit"> Create </ScalarButton>
  </form>
</template>
