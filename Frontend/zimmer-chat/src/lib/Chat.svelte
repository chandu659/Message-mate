<script>
  import { selectedChatStore } from './store';
  import { currentUser, pb } from './pocketbase';
  import { onMount, onDestroy, tick } from 'svelte';
  import { getAvatarUrl } from './util/avatar';
  import './Chat.svelte.css';

  let selectedChat = null;
  let messages = [];
  let newMessage = '';
  let unsubscribeFromChat = null;
  let chatMessagesDiv; 

  // Scroll to the bottom of the chat
  async function scrollToBottom() {
    if (chatMessagesDiv) {
      await tick(); 
      chatMessagesDiv.scrollTop = chatMessagesDiv.scrollHeight;
      console.log("Scroll to bottom");
    }
  }

  // Load initial messages, and subscribe to real time updates when mounted
  onMount(async () => {
    selectedChatStore.subscribe(async (value) => {
      selectedChat = value;

      if (selectedChat) {
        const resultList = await pb.collection('messages').getList(1, 50, {
          filter: `chatid="${selectedChat.id}"`,
          sort: 'created',
          expand: 'user',
        });
        messages = resultList.items;
        scrollToBottom();

        if (unsubscribeFromChat) {
          unsubscribeFromChat();
        }

        // Subscribe to real-time updates for messages in the selected chat
        unsubscribeFromChat = await pb.collection('messages').subscribe('*', async ({ action, record }) => {
          if (record.chatid === selectedChat.id) {
            if (action === 'create') {
              // Fetch associated user for the new message
              const user = await pb.collection('users').getOne(record.user);
              record.expand = { user };
              messages = [...messages, record];
              scrollToBottom(); 
            } else if (action === 'delete') {
              messages = messages.filter((m) => m.id !== record.id);
            }
          }
        });
      }
    });
  });

  // Unsubscribe from real-time updates when component is destroyed
  onDestroy(() => {
    if (unsubscribeFromChat) {
      unsubscribeFromChat();
    }
  });

  // Send a new message
  async function handleSendMessage() {
    const data = {
      Text: newMessage,
      user: $currentUser.id,
      chatid: selectedChat.id,
    };
    await pb.collection('messages').create(data);
    newMessage = ''; 
  }

  // Scroll to bottom whenever messages array changes
  $: messages, scrollToBottom();
</script>


<div class="chat-content">
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
  {/if}
</div>