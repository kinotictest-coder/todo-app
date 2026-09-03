<script setup lang="ts">
import Button from 'primevue/button'
import Card from 'primevue/card'
import InputText from 'primevue/inputtext'
import Message from 'primevue/message'
import Password from 'primevue/password'
import { ref } from 'vue'
import { connection, login } from '../kinotic/connection'

const email = ref('')
const password = ref('')

async function submit() {
	try {
		await login(email.value.trim(), password.value)
	} catch {
		/* connection.error is set by login() */
	}
}
</script>

<template>
	<div class="login">
		<Card class="login__card">
			<template #title>Todo App</template>
			<template #subtitle>Sign in with your application user</template>
			<template #content>
				<form class="login__form" @submit.prevent="submit">
					<div class="field">
						<label for="email">Email</label>
						<InputText
							id="email"
							v-model="email"
							type="email"
							autocomplete="username"
							required
						/>
					</div>
					<div class="field">
						<label for="password">Password</label>
						<Password
							input-id="password"
							v-model="password"
							:feedback="false"
							toggle-mask
							fluid
							autocomplete="current-password"
							required
						/>
					</div>
					<Message v-if="connection.status === 'error'" severity="error" size="small">
						{{ connection.error }}
					</Message>
					<Button
						type="submit"
						label="Sign in"
						:loading="connection.status === 'connecting'"
					/>
				</form>
			</template>
		</Card>
	</div>
</template>
