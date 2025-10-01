<template>
  <v-app theme="dark">
    <v-container>
      <v-snackbar-queue v-model="messages" color="primary" location="top center" timeout="2000" />
      <v-snackbar-queue v-slot="{ item }" v-model="messages" color="primary" timeout="2000">
        <pre>{{ item }}</pre>
      </v-snackbar-queue>
    </v-container>
  </v-app>
</template>
<script setup>
  import { onBeforeUnmount, onMounted, ref } from 'vue'

  let counter = 0
  let _interval = -1
  const messages = ref([])

  onMounted(() => {
    _interval = window.setInterval(() => {
      messages.value.push(`You have ${counter++} messages in the Inbox.`)
      console.log('counter', counter)
    }, 1000)
  })

  onBeforeUnmount(() => {
    counter = 0
    messages.value = []
    clearInterval(_interval)
  })
</script>
