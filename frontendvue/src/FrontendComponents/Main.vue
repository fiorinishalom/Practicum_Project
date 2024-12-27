<template>
  <div class="layout">
    <div class="sidebar">
      <h3>Group Chats</h3>
      <InputNumber v-model="id" inputId="integeronly" placeholder="Enter ID" />
      <Button label="Submit" @click="fetchInfo()" />
      <hr />
      <div v-for="aside in asides" :key="aside.id" class="chat-item" @click="selectChat(aside)">
        {{ aside.asideName }}
      </div>
    </div>
    <div class="main-content">
      <h3>Messages</h3>
      <!-- Show messages when a chat is selected -->
      <div v-if="currentAside.messages.length > 0">
        <div v-for="message in currentAside.messages" :key="message.id" class="message">
          {{ message.Content }}
        </div>
      </div>
      <div v-else>
        No Messages
      </div>
      <p v-else>Select a group chat to view messages.</p>
    </div>
  </div>
</template>

<script setup>
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import { ref } from 'vue';

const id = ref(); // User ID
const asides = ref([]); // List of group chats
const currentAside = ref({ meta:null, messages:[] });

// Fetch the list of group chats for a user
async function fetchInfo() {
  try {
    const url = 'http://localhost:3000/groups';
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: id.value }),
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    asides.value = data;
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error);
  }
}

// Fetch messages for the selected group chat
async function selectChat(aside) {
  try {
    console.log('Asides:', aside.AsideID);

    const url = 'http://localhost:3000/messages';
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ asideId: aside.AsideID }),
    };

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    currentAside.value.meta = aside;
    currentAside.value.messages = data;
  } catch (error) {
    console.error('There was a problem with the fetch operation:', error);
  }
}
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh;
}

.sidebar {
  width: 25%;
  padding: 20px;
  background-color: #f7f7f7;
  border-right: 1px solid #ddd;
}

.chat-item {
  padding: 10px;
  margin: 5px 0;
  border: 1px solid transparent;
  border-radius: 5px;
  cursor: pointer;
  transition: background-color 0.3s, border-color 0.3s;
}

.chat-item:hover {
  background-color: #e3f2fd;
  border-color: #90caf9;
}

.main-content {
  width: 75%;
  padding: 20px;
}

.message-item {
  padding: 10px;
  margin: 5px 0;
  border-bottom: 1px solid #ddd;
}

h3 {
  margin-top: 0;
}

.message {
  background-color: #e3f2fd;
  color: #0d47a1;
  border-radius: 15px;
  padding: 10px 15px;
  max-width: 60%;
  word-wrap: break-word;
  margin: 10px 0;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  font-family: Arial, sans-serif;
  font-size: 14px;
  position: relative;
}
</style>
