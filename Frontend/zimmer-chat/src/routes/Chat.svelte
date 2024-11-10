<script>
  import { selectedChatStore } from '../lib/store';
  import { currentUser, pb } from '../lib/pocketbase';
  import { onDestroy, tick } from 'svelte';
  import { getAvatarUrl } from '../lib/util/avatar';
  import Sidebar from '../lib/components/sidebar/Sidebar.svelte';
  import Signout from '../lib/components/signout/Signout.svelte';
  import '../lib/components/chat/Chat.css';
  import { push } from 'svelte-spa-router';

  let selectedChat = null;
  let lastChatId = null; 
  let messages = [];
  let newMessage = '';
  let unsubscribeFromChat = null;
  let chatMessagesDiv;
  let user;

  currentUser.subscribe(value =>{
    user = value;
    if(!user){
      push('/login');
    }
  });

  // Subscribe to selectedChatStore for updates
  const unsubscribeSelectedChat = selectedChatStore.subscribe(async (value) => {
    selectedChat = value;
    if (selectedChat && selectedChat.id !== lastChatId) {
      await loadMessagesAndSubscribe();
    } else {
      resetChat();
      lastChatId = null;
    }
  });

  function resetChat() {
    messages = [];
    if (unsubscribeFromChat) {
      unsubscribeFromChat();
      unsubscribeFromChat = null;
    }
  }

  async function loadMessagesAndSubscribe() {
    if (!selectedChat || !selectedChat.id) return;

    const chatId = selectedChat.id;
    if (lastChatId === chatId) return; 

    lastChatId = chatId;
    resetChat();

    try {
      const resultList = await pb.collection('messages').getList(1, 50, {
        filter: `chatid="${chatId}"`,
        sort: 'created',
        expand: 'user',
      });

      messages = resultList.items;
      await scrollToBottom();

      unsubscribeFromChat = await pb.collection('messages').subscribe('*', async ({ action, record }) => {
        if (record.chatid === chatId) {
          if (action === 'create') {
            const user = await pb.collection('users').getOne(record.user);
            record.expand = { user };
            messages = [...messages, record];
            await scrollToBottom();
          } else if (action === 'delete') {
            messages = messages.filter((m) => m.id !== record.id);
          }
        }
      });
    } catch (error) {
      // Handle error
    }
  }

  async function scrollToBottom() {
    if (chatMessagesDiv) {
      await tick();
      chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
    }
  }

  async function handleSendMessage() {
    if (selectedChat && newMessage.trim()) {
      const data = {
        Text: newMessage,
        user: $currentUser.id,
        chatid: selectedChat.id,
      };
      try {
        await pb.collection('messages').create(data);
        newMessage = '';
      } catch (error) {
        // Handle error
      }
    }
  }

  onDestroy(() => {
    if (unsubscribeSelectedChat) unsubscribeSelectedChat();
    if (unsubscribeFromChat) unsubscribeFromChat();
  });

  $: messages, scrollToBottom();
</script>

{#if user}
<div class="app-container">
  <Sidebar />
  <div class="chat-content">
    <Signout />
    
    {#if selectedChat}
      
      <div class="chat-header">
        {#each selectedChat.expand.users as user}
          {#if user.id !== $currentUser.id}
            <img src={getAvatarUrl(user.id)} alt="avatar" class="chat-avatar" />
            <span class="chat-username">{user.username || user.email}</span>
          {/if}
        {/each}
      </div>

      <div class="chat-messages" bind:this={chatMessagesDiv}>
        {#each messages as message (message.id)}
          <div class="msg {message.expand?.user?.id === $currentUser.id ? 'sent' : 'received'}">
            <p>{message.Text}</p>
          </div>
        {/each}
      </div>

      <form class="message-form" on:submit|preventDefault={handleSendMessage}>
        <input type="text" placeholder="Type a message..." bind:value={newMessage} />
        <button type="submit">Send</button>
      </form>
    {:else}
      
      <div class="no-chat-selected">
        <p>Select a user to chat.</p>
      </div>
    {/if}
  </div>
</div>
{/if}