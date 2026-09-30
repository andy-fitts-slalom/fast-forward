<script setup lang="ts">
import { ref, watch } from 'vue'
import { useDisplay } from 'vuetify'

const { mdAndUp } = useDisplay()
const drawer = ref(false)
watch(mdAndUp, (isDesktop) => { drawer.value = isDesktop }, { immediate: true })
</script>

<template>
  <v-app>
    <v-app-bar class="mobile-bar" color="surface" elevation="0" height="64">
      <v-app-bar-nav-icon aria-label="Open navigation" @click="drawer = !drawer" />
      <v-toolbar-title class="brand-title">FIELDNOTE</v-toolbar-title>
    </v-app-bar>
    <v-navigation-drawer v-model="drawer" :permanent="mdAndUp" :temporary="!mdAndUp" width="248" class="app-drawer">
      <div class="brand-lockup">
        <div class="brand-mark"><v-icon icon="mdi-chart-box" size="21" /></div>
        <div><div class="brand-title">FIELDNOTE</div><div class="brand-caption">BUSINESS INTELLIGENCE</div></div>
      </div>
      <div class="nav-label">WORKSPACE</div>
      <v-list nav class="nav-list" aria-label="Main navigation">
        <v-list-item to="/" prepend-icon="mdi-view-dashboard-outline" title="Overview" rounded="lg" />
        <v-list-item to="/reports" prepend-icon="mdi-chart-line" title="Reports" rounded="lg" />
      </v-list>
      <template #append>
        <div class="workspace-switcher">
          <v-avatar color="secondary" size="34"><span class="avatar-initials">AC</span></v-avatar>
          <div class="workspace-copy"><div class="workspace-name">Acme Creative</div><div class="workspace-plan">Growth workspace</div></div>
          <v-icon icon="mdi-chevron-up-down" size="18" color="grey-darken-1" />
        </div>
      </template>
    </v-navigation-drawer>
    <v-main><router-view /></v-main>
  </v-app>
</template>
