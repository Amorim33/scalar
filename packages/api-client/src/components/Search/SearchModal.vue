<script setup lang="ts">
import { HttpMethod } from '@/components/HttpMethod'
import { useWorkspace } from '@/store'
import {
  type ModalState,
  ScalarModal,
  ScalarSearchInput,
  ScalarSearchResultItem,
  ScalarSearchResultList,
} from '@scalar/components'
import type { Request } from '@scalar/oas-utils/entities/spec'
import { useMagicKeys, whenever } from '@vueuse/core'
import Fuse, { type FuseResult } from 'fuse.js'
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps<{
  modalState: ModalState
}>()

const router = useRouter()

const { activeWorkspaceRequests, requests } = useWorkspace()

const keys = useMagicKeys()

type FuseData = {
  title: string
  description: string
  httpVerb: string
  id: string
  path: string
}

const fuseDataArray = ref<FuseData[]>([])
const searchResults = ref<FuseResult<FuseData>[]>([])
const selectedSearchResult = ref<number>(0)
const searchText = ref<string>('')
const searchModalRef = ref<HTMLElement | null>(null)

const fuse = new Fuse(fuseDataArray.value, {
  keys: ['title', 'description', 'body'],
})

const resetSearch = () => {
  searchText.value = ''
  selectedSearchResult.value = 0
  searchResults.value = []
}

const populateFuseDataArray = (specifiedRequests: Request[]) => {
  fuseDataArray.value = specifiedRequests.map((request: Request) => ({
    id: request.uid,
    title: request.summary ?? request.method,
    description: request.description ?? '',
    httpVerb: request.method,
    path: request.path,
  }))

  fuse.setCollection(fuseDataArray.value)
}

const fuseSearch = (): void => {
  selectedSearchResult.value = 0
  searchResults.value = fuse.search(searchText.value)
}

watch(
  () => props.modalState.open,
  (open) => {
    if (!open) {
      if (fuseDataArray.value.length > 0) {
        fuseDataArray.value = []
        fuse.setCollection(fuseDataArray.value)
      }
      return
    }
    searchModalRef.value?.focus()
    resetSearch()
    populateFuseDataArray(
      activeWorkspaceRequests.value.map((uid) => requests[uid]),
    )
  },
)

// Populate our fuseDataArray with the request items
watch(
  activeWorkspaceRequests,
  (newRequests) => {
    populateFuseDataArray(newRequests.map((uid) => requests[uid]))
  },
  { immediate: true },
)

function onSearchResultClick(entry: FuseResult<FuseData>) {
  router.push(entry.item.id)
  props.modalState.hide()
}

const selectedEntry = computed<FuseResult<FuseData>>(
  () => searchResultsWithPlaceholderResults.value[selectedSearchResult.value],
)

const searchResultsWithPlaceholderResults = computed(
  (): FuseResult<FuseData>[] => {
    if (searchText.value.length === 0) {
      return fuseDataArray.value.map((item) => {
        return {
          item: item,
        } as FuseResult<FuseData>
      })
    }

    return searchResults.value
  },
)

whenever(keys.enter, () => {
  if (!props.modalState.open) {
    return
  }

  if (!window) {
    return
  }

  onSearchResultClick(selectedEntry.value)
})

whenever(keys.ArrowDown, () => {
  if (!props.modalState.open) {
    return
  }

  if (!window) {
    return
  }

  if (
    selectedSearchResult.value <
    searchResultsWithPlaceholderResults.value.length - 1
  ) {
    selectedSearchResult.value++
  } else {
    selectedSearchResult.value = 0
  }

  document
    .getElementById(`search-modal-${selectedEntry.value.item.id}`)
    ?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
})

whenever(keys.ArrowUp, () => {
  if (!props.modalState.open) {
    return
  }

  if (!window) {
    return
  }

  if (selectedSearchResult.value > 0) {
    selectedSearchResult.value--
  } else {
    selectedSearchResult.value =
      searchResultsWithPlaceholderResults.value.length - 1
  }

  document
    .getElementById(`search-modal-${selectedEntry.value.item.id}`)
    ?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
})
</script>
<template>
  <ScalarModal
    :state="modalState"
    variant="search">
    <div
      ref="searchModalRef"
      class="ref-search-container">
      <ScalarSearchInput
        v-model="searchText"
        @input="fuseSearch" />
    </div>
    <ScalarSearchResultList
      class="ref-search-results custom-scroll"
      :noResults="!searchResultsWithPlaceholderResults.length">
      <ScalarSearchResultItem
        v-for="(entry, index) in searchResultsWithPlaceholderResults"
        :id="`#search-modal-${entry.item.id}`"
        :key="entry.refIndex"
        :active="selectedSearchResult === index"
        icon="Terminal"
        @click="onSearchResultClick(entry)"
        @focus="selectedSearchResult = index">
        {{ entry.item.title }}
        <template
          v-if="
            (entry.item.httpVerb || entry.item.path) &&
            entry.item.path !== entry.item.title
          "
          #description>
          {{ entry.item.path }}
        </template>
        <template
          v-else-if="entry.item.description"
          #description>
          {{ entry.item.description }}
        </template>
        <template #addon>
          <HttpMethod :method="entry.item.httpVerb ?? 'get'" />
        </template>
      </ScalarSearchResultItem>
      <template #query>{{ searchText }}</template>
    </ScalarSearchResultList>
    <div class="ref-search-meta">
      <span>↑↓ Navigate</span>
      <span>⏎ Select</span>
    </div>
  </ScalarModal>
</template>
<style scoped>
a {
  text-decoration: none;
}
.ref-search-container {
  display: flex;
  flex-direction: column;
  padding: 12px;
  padding-bottom: 0px;
}
.ref-search-results {
  padding: 12px;
}
.ref-search-meta {
  background: var(--scalar-background-3);
  padding: 6px 12px;
  font-size: var(--scalar-font-size-4);
  color: var(--scalar-color-3);
  font-weight: var(--scalar-semibold);
  display: flex;
  gap: 12px;
}
</style>
