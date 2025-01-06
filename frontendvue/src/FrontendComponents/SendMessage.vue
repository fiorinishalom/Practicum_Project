<template>
  <div class="send-message">
    <InputText v-model="message" placeholder="Type a message" @keydown.enter="sendMessage" />
    <Button icon="pi pi-send" variant="text" @click="sendMessage"/>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { defineEmits } from 'vue';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';

const message = ref('');
const emit = defineEmits(['send-message']);

const sendMessage = () => {
  if (message.value.trim() !== '') {
    emit('send-message', message.value);
    message.value = '';
  }
};
</script>
<style scoped>
.send-message {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.send-message >>> .p-inputtext {
  flex: 1;
}
</style> 
