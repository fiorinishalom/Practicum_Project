<template>
  <div class="layout">
    <div class="sidebar">
      <div>
      <h3>Group Chats</h3>
      <hr />
      <div v-for="aside in asides" :key="aside.id" class="chat-item" @click="selectChat(aside)">
        {{ aside.asideName }}
      </div>
    </div>
      <Button icon="pi pi-sign-out" severity="danger" rounded variant="outlined" @click="handleLogout" />
    </div>
    <div class="main-content">
      <div style="overflow-y: scroll; height:100%;">
      <h3>Messages</h3>
      <!-- Show messages when a chat is selected -->
      <div v-if="currentAside.messages.length > 0">
        <div v-for="message in currentAside.messages" :key="message.id" class="message">
          {{ message.Content }}
        </div>
      </div>
      <p v-else>Select a group chat to view messages.</p>
    </div>
    <div>
      <SendMessage @send-message="sendMessage" v-if="currentAside.meta"/>
    </div>
    </div>
  </div>
</template>

<script setup>
import SendMessage from './SendMessage.vue';
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button';
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const asides = ref([]); // List of group chats
const userId = ref(); 
const currentAside = ref({ meta:null, messages:[] });
const router = useRouter();
const handleLogout = () => {
  document.cookie = 'login=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
  router.push('/login');
};

// Fetch the list of group chats for a user
async function fetchInfo(id) {
      console.log(3)

  console.log(id)
  try {
    const url = 'http://localhost:3000/groups';
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id: id }),
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

// Send a message to an aside
const sendMessage = async (message) => {
  console.log(JSON.stringify({ text: message, asideId: currentAside.value.meta.AsideID, userId: userId.value }));
  
  try {
    const response = await fetch('http://localhost:3000/addMessage', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text: message, asideId: currentAside.value.meta.AsideID, userId: userId.value }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    selectChat(currentAside.value.meta.AsideID);

  } catch (error) {
    console.error('Error sending message:', error);
  }
};



onMounted(() => {
  const cookieValue = document.cookie
    .split('; ')
    .find((row) => row.startsWith('login='))
    ?.split('=')[1];
  if (cookieValue) {
    userId.value = cookieValue;
    fetchInfo(cookieValue);
  }
});
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
  display: flex;
  flex-direction: column;
  justify-content: space-between;
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
  display: flex;
  flex-direction: column;
  justify-content: space-between;
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
