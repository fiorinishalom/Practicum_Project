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
      <!-- Future message content goes here -->
      <p>Select a group chat to view messages.</p>
    </div>
  </div>
</template>

<script setup>
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import { ref } from 'vue';

const id = ref();
const asides = ref([]);
const asideMessages = ref([]);
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
    throw error;
  }
}

function selectChat(aside) {
  // Handle chat selection (e.g., fetch messages for the selected chat)
  console.log("Selected chat:", aside);
  asideMessages.value = [];
}
</script>

<style scoped>
.layout {
  display: flex;
  height: 100vh; /* Full height for the layout */
}

.sidebar {
  width: 25%; /* 1/4 of the width */
  padding: 20px; /* Padding for the sidebar */
  background-color: #f7f7f7; /* Light background for the sidebar */
  border-right: 1px solid #ddd; /* Right border for separation */
}

.chat-item {
  padding: 10px; /* Padding for each chat item */
  margin: 5px 0; /* Margin between items */
  border: 1px solid transparent; /* Border for hover effect */
  border-radius: 5px; /* Rounded corners */
  cursor: pointer; /* Pointer cursor to indicate clickable item */
  transition: background-color 0.3s, border-color 0.3s; /* Smooth transition */
}

.chat-item:hover {
  background-color: #e3f2fd; /* Light blue background on hover */
  border-color: #90caf9; /* Blue border on hover */
}

.main-content {
  width: 75%; /* 3/4 of the width */
  padding: 20px; /* Padding for the main content */
}

h3 {
  margin-top: 0; /* Remove margin on top of headings */
}
</style>
