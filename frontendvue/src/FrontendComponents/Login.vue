<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="text-center">Login</h2>
      <div class="p-fluid">
        <div class="p-field">
          <label for="username">Username</label>
          <InputText id="username" v-model="username" placeholder="Enter your username" />
        </div>
        <div class="p-field">
          <label for="password">Password</label>
          <Password id="password" v-model="password" :feedback="false" placeholder="Enter your password" toggleMask />
        </div>

        <Button label="Login" class="p-button-primary" @click="handleLogin" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import  InputText  from 'primevue/inputtext';
import  Password  from 'primevue/password';
import  Button  from 'primevue/button';
import  Card  from 'primevue/card';

const username = ref('');
const password = ref('');

const handleLogin = async (username, password) => {
  if (username.value && password.value) {




    try {

      const url = 'http://localhost:3000/checkLogin';
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      };

      const response = await fetch(url, options);

      if (!response.status) {
        console.log("bad login info")
      }else{

      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      currentAside.value.meta = aside;
      currentAside.value.messages = data;
    } catch (error) {
      console.error('There was a problem with the fetch operation:', error);
    }




  } else {
    console.error('Please enter both username and password.');
  }
};
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(to bottom right, #4caf50, #81c784);
}

.login-card {
  width: 400px;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  background:white;
}

.text-center {
  text-align: center;
  margin-bottom: 1.5rem;
}
</style>
