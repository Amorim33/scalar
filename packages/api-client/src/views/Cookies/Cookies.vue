<script setup lang="ts">
import { Sidebar } from '@/components'
import SidebarButton from '@/components/Sidebar/SidebarButton.vue'
import SidebarList from '@/components/Sidebar/SidebarList.vue'
import SidebarListElement from '@/components/Sidebar/SidebarListElement.vue'
import ViewLayout from '@/components/ViewLayout/ViewLayout.vue'
import ViewLayoutContent from '@/components/ViewLayout/ViewLayoutContent.vue'
import { useWorkspace } from '@/store/workspace'
import { createCookie } from '@scalar/oas-utils/entities/workspace/cookie'
import { nanoid } from 'nanoid'
import { useRouter } from 'vue-router'

import CookieForm from './CookieForm.vue'
import CookieRaw from './CookieRaw.vue'

const { cookies, cookieMutators } = useWorkspace()
const router = useRouter()

const addCookieHandler = () => {
  const cookie = createCookie({
    uid: nanoid(),
    name: 'new cookie',
    value: 'new value',
    domain: 'localhost',
    path: '/',
    secure: false,
    httpOnly: false,
    sameSite: 'None',
  })

  cookieMutators.add(cookie)
  router.push(cookie.uid)
}
</script>
<template>
  <ViewLayout>
    <Sidebar>
      <template #title>Domain</template>
      <template #content>
        <div class="flex-1">
          <SidebarList>
            <SidebarListElement
              v-for="cookie in cookies"
              :key="cookie.uid"
              class="text-xs"
              :variable="{ name: cookie.name, uid: cookie.uid }" />
          </SidebarList>
        </div>
      </template>
      <template #button>
        <SidebarButton :click="addCookieHandler">
          <template #title>Add Item</template>
        </SidebarButton>
      </template>
    </Sidebar>

    <ViewLayoutContent class="flex-1">
      <CookieForm />
      <CookieRaw />
    </ViewLayoutContent>
  </ViewLayout>
</template>
