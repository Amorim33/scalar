<script setup lang="ts">
import { useWorkspace } from '@/store/workspace'
import { ScalarIcon } from '@scalar/components'

type IconProps = InstanceType<typeof ScalarIcon>['$props']

defineProps<{
  icon: IconProps['icon']
  path: string
  active?: boolean
}>()

const { activeWorkspace } = useWorkspace()
</script>
<template>
  <router-link
    activeClass="active-link"
    class="w-[37px] hover:bg-b-2 active:text-c-1 flex items-center justify-center rounded-lg p-[7px]"
    :class="{ 'bg-b-2 transition-none hover:cursor-auto text-c-1': active }"
    :to="`/workspace/${activeWorkspace.uid}${path}`">
    <ScalarIcon
      :icon="icon"
      thickness="1.5" />
    <span class="sr-only"><slot /></span>
  </router-link>
</template>
