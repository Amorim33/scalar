<script setup lang="ts">
import { themeClasses } from '@/constants'
import { executeRequestBus, syncPathParamsFromURL } from '@/libs'
import { useWorkspace } from '@/store/workspace'
import {
  Listbox,
  ListboxButton,
  ListboxOption,
  ListboxOptions,
} from '@headlessui/vue'
import { ScalarButton, ScalarIcon } from '@scalar/components'
import { httpStatusCodes } from '@scalar/oas-utils/helpers'
import { isMacOS } from '@scalar/use-tooltip'
import { useMagicKeys, whenever } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

import HttpMethod from '../HttpMethod/HttpMethod.vue'
import { REQUEST_METHODS, type RequestMethod } from '../HttpMethod/httpMethods'
import { getStatusCodeColor } from './httpStatusCodeColors'

const {
  activeRequest,
  activeInstance,
  activeInstanceIdx,
  updateRequestInstance,
  requestMutators,
} = useWorkspace()

const history = computed(() => activeRequest.value?.history ?? [])

const selectedRequest = ref(history.value[0])
const keys = useMagicKeys()
whenever(isMacOS() ? keys.meta_enter : keys.ctrl_enter, () =>
  executeRequestBus.emit(),
)

watch(
  () => activeInstance.value?.url,
  (newURL, oldURL) => {
    if (!activeRequest.value) return

    const toUpdate = syncPathParamsFromURL(
      newURL,
      oldURL,
      activeInstance.value?.parameters.path,
    )
    if (toUpdate)
      updateRequestInstance(
        activeRequest.value.uid,
        activeInstanceIdx,
        toUpdate.key,
        toUpdate.value,
      )
  },
)

/** Ensure we update the instance path parameters on change as well */
const onUrlChange = (newPath: string) => {
  if (!activeRequest.value) return

  updateRequestInstance(
    activeRequest.value.uid,
    activeInstanceIdx,
    'url',
    newPath,
  )
}

const percentage = ref(100)

executeRequestBus.on(() => {
  const interval = setInterval(() => {
    percentage.value -= 5
    if (percentage.value <= 0) {
      clearInterval(interval)
      percentage.value = 100
    }
  }, 20)
})

function updateRequestMethod(method: string) {
  if (!activeRequest.value) return
  requestMutators.edit(activeRequest.value.uid, 'method', method)
}

function getBackgroundColor() {
  if (!activeRequest.value) return undefined
  const { method } = activeRequest.value
  return REQUEST_METHODS[method as RequestMethod].backgroundColor
}

/**
 * Get the host from the scalar proxy request
 * @param request
 */
function getHost(request: XMLHttpRequest) {
  const url = new URL(request.responseURL)

  const params = new URLSearchParams(url.search)

  const scalarUrl = params.get('scalar_url')
  if (!scalarUrl) return url.origin

  const scalarUrlParsed = new URL(scalarUrl)

  const baseUrl = scalarUrlParsed.origin

  return baseUrl
}

/**
 * Get the pathName from the scalar proxy request
 * @param request
 */
function getPathName(request: XMLHttpRequest) {
  const url = new URL(request.responseURL)

  const params = new URLSearchParams(url.search)

  const scalarUrl = params.get('scalar_url')
  if (!scalarUrl) return url.origin

  const scalarUrlParsed = new URL(scalarUrl)

  const pathName = scalarUrlParsed.pathname

  return pathName
}

/**
 * TODO: This component is pretty much mocked for now, will come back and finish it up once we
 * Start making requests and adding some history
 */
</script>
<template>
  <div
    v-if="activeRequest && activeInstance"
    class="min-h-header flex flex-row items-center"
    :class="[themeClasses.topContainer]">
    <!-- <div class="text-c-2 flex w-80 flex-row items-center gap-1 p-4">
      <ScalarIcon
        icon="Branch"
        size="md" />
      <h2 class="text-sm">Branch Name</h2>
    </div> -->

    <div class="m-auto flex basis-1/2 flex-row items-center">
      <!-- Address Bar -->
      <Listbox
        v-slot="{ open }"
        v-model="selectedRequest">
        <div
          :class="[
            'text-xxs bg-b-1 relative flex w-[720px] flex-1 flex-row items-stretch rounded border p-[3px]',
            { 'rounded-b-none': open },
            { 'border-transparent': open },
          ]">
          <div
            class="pointer-events-none absolute left-0 top-0 z-10 block h-full w-full overflow-hidden">
            <div
              class="bg-mix-transparent bg-mix-amount-95 absolute left-0 top-0 h-full w-full"
              :class="getBackgroundColor()"
              :style="{ transform: `translate3d(-${percentage}%,0,0)` }"></div>
          </div>
          <HttpMethod
            class="font-bold"
            isEditable
            isSquare
            :method="activeRequest.method"
            @change="updateRequestMethod" />
          <div
            class="scroll-timeline-x custom-scroll relative flex w-full overflow-hidden overflow-x-auto overflow-y-hidden">
            <div class="fade-left"></div>

            <!-- TODO wrap vars in spans for special effects like mouseOver descriptions -->
            <div>
              <div
                class="custom-scroll font-code text-c-1 flex flex-1 items-center whitespace-nowrap text-sm font-medium leading-[24.5px]"
                contenteditable
                @input="
                  (ev) => onUrlChange((ev.target as HTMLElement).innerText)
                "
                @keydown.enter.prevent="executeRequestBus.emit()">
                {{ activeInstance.url }}
              </div>
            </div>
            <div class="fade-right"></div>
          </div>

          <!-- History -->
          <ListboxButton
            v-if="activeRequest.history.length"
            class="hover:bg-b-2 mr-1 rounded p-1.5">
            <ScalarIcon
              class="text-c-3"
              icon="History"
              size="xs" />
          </ListboxButton>

          <!-- History shadow and placement-->
          <div
            :class="[
              'absolute left-0 top-[31px] w-full rounded before:pointer-events-none before:absolute before:left-0 before:top-[-31.5px] before:h-[calc(100%+31.5px)] before:w-full before:rounded',
              { 'before:shadow-lg': open },
            ]">
            <!-- History Item -->
            <ListboxOptions
              class="bg-b-1 custom-scroll bg-mix-transparent bg-mix-amount-30 max-h-[300px] rounded-b p-[3px] pt-0 backdrop-blur">
              <ListboxOption
                v-for="({ response }, index) in history"
                :key="index"
                class="ui-active:bg-b-2 text-c-1 ui-active:text-c-1 flex cursor-pointer flex-row gap-2.5 rounded px-2.5 py-1.5 pr-3"
                :value="index">
                <div class="font-code flex flex-1 gap-1.5 text-sm font-medium">
                  <span
                    class="mr-[1px] min-w-[44px] pr-2 text-right"
                    :class="[getStatusCodeColor(response.status).color]">
                    {{ response.status }}
                  </span>
                  <span class="text-c-2 gap-0">
                    {{ getHost(response.request) }}
                    <em class="text-c-1 ml-[-8px]">{{
                      getPathName(response.request)
                    }}</em>
                  </span>
                </div>

                <!-- Response info -->
                <div
                  class="font-code text-c-3 flex flex-row items-center gap-3 text-sm font-medium">
                  <!-- <span>{{ formatMs(response.ms) }}</span> -->
                  <!-- <span>{{ formatBytes(response.bytes) }}</span> -->
                  <span>
                    {{ httpStatusCodes[response.status]?.name }}
                  </span>
                  <HttpMethod
                    class="text-sm"
                    :method="activeRequest.method" />
                </div>
              </ListboxOption>
            </ListboxOptions>
          </div>
          <ScalarButton
            class="relative h-auto shrink-0 gap-1.5 overflow-hidden px-2.5 py-1"
            @click="executeRequestBus.emit()">
            <ScalarIcon
              class="relative z-10 w-2 shrink-0"
              icon="Play"
              size="xs" />
            <span class="text-xxs relative z-10">Send</span>
          </ScalarButton>
        </div>
      </Listbox>
    </div>
  </div>
</template>
<style scoped>
:deep(.cm-editor) {
  background-color: var(--scalar-background-1);
  height: 100%;
  outline: none;
  width: 100%;
}
:deep(.cm-content) {
  padding: 2px 0;
}
.scroll-timeline-x {
  scroll-timeline: --scroll-timeline x;
  /* Firefox supports */
  scroll-timeline: --scroll-timeline horizontal;
}
.fade-left,
.fade-right {
  content: '';
  position: sticky;
  height: 100%;
  animation-name: fadein;
  animation-duration: 1ms;
  animation-direction: reverse;
  animation-timeline: --scroll-timeline;
  z-index: 1;
}
.fade-left {
  background: linear-gradient(
    -90deg,
    color-mix(in srgb, var(--scalar-background-1), transparent 100%) 0%,
    color-mix(in srgb, var(--scalar-background-1), transparent 20%) 30%,
    var(--scalar-background-1) 100%
  );
  left: 0;
  min-width: 6px;
}
.fade-right {
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--scalar-background-1), transparent 100%) 0%,
    color-mix(in srgb, var(--scalar-background-1), transparent 20%) 30%,
    var(--scalar-background-1) 100%
  );
  right: 0;
  min-width: 24px;
  animation-direction: reverse;
}
@keyframes fadein {
  0% {
    opacity: 0;
  }
  2% {
    opacity: 1;
  }
}
</style>
./httpStatusCodeColors