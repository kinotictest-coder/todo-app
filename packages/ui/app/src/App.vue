<script setup lang="ts">
import ConfirmDialog from 'primevue/confirmdialog'
import Toast from 'primevue/toast'
import { computed } from 'vue'
import AppShell from './components/AppShell.vue'
import LoginView from './components/LoginView.vue'
import { connection } from './kinotic/connection'

const authed = computed(() => connection.status === 'connected')
</script>

<template>
	<AppShell v-if="authed" />
	<LoginView v-else />
	<Toast position="bottom-right" />
	<ConfirmDialog />
</template>
