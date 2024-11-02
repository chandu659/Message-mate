<script>
  import { selectedChatStore } from './store';
  import { currentUser, pb } from './pocketbase';
  import { onMount, onDestroy, tick } from 'svelte';
  import { getAvatarUrl } from './util/avatar';
  import './Chat.svelte.css';

  let selectedChat = null;
  let lastChatId = null; 
  let messages = [];
  let newMessage = '';
  let unsubscribeFromChat = null;
  let chatMessagesDiv;

  function resetChat() {
    console.log("Resetting chat");
    messages = [];
    if (unsubscribeFromChat) {
      unsubscribeFromChat();
      unsubscribeFromChat = null;
    }
  }

  async function loadMessagesAndSubscribe() {
  
    const chatId = selectedChat?.id;
    if (!chatId) {
      console.warn("No valid chat id. Exiting loadMessagesAndSubscribe.");
      return;
    }

    if (lastChatId === chatId) {
      console.log("Already subscribed to this chat:", chatId);
      return; 
    }

    lastChatId = chatId;
    resetChat(); 

    try {
      console.log("Loading messages for chat:", chatId);
      const resultList = await pb.collection('messages').getList(1, 50, {
        filter: `chatid="${chatId}"`,
        sort: 'created',
        expand: 'user',
      });

      messages = resultList.items;
      console.log("Messages loaded:", messages);

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
      console.error("Error loading messages or setting up subscription:", error);
    }
  }


  let unsubscribeSelectedChat = null;
  onMount(() => {
    unsubscribeSelectedChat = selectedChatStore.subscribe(async (value) => {
      console.log("Selected chat updated:", value); 

      if (value && value.id && value.id !== lastChatId) {
        selectedChat = value;
        console.log("Loading messages for selected chat with ID:", selectedChat.id);
        await loadMessagesAndSubscribe();
      } else if (!value || !value.id) {
        resetChat();
        lastChatId = null; 
      }
    });
  });

  onDestroy(() => {
    console.log("Component is being destroyed, cleaning up subscriptions");
    if (unsubscribeSelectedChat) unsubscribeSelectedChat();
    if (unsubscribeFromChat) unsubscribeFromChat();
  });

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
      await pb.collection('messages').create(data);
      newMessage = '';
    }
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

    <!-- Render chat messages -->
    <div class="chat-messages" bind:this={chatMessagesDiv}>
      {#each messages as message (message.id)}
        <div class="msg {message.expand?.user?.id === $currentUser.id ? 'sent' : 'received'}">
          <p>{message.Text}</p>
        </div>
      {/each}
    </div>

    <!-- Message form -->
    <form class="message-form" on:submit|preventDefault={handleSendMessage}>
      <input type="text" placeholder="Type a message..." bind:value={newMessage} />
      <button type="submit">Send</button>
    </form>
  {/if}
</div>