<script>
  import { onMount, onDestroy } from 'svelte';
  import { usersStore, chatsStore, updateSelectedChat, selectedChatStore } from '../../store';
  import { currentUser, pb } from '../../pocketbase';
  import { getAvatarUrl } from '../../util/avatar';
  import { loadUsers, loadChats } from '../../util/chat';
  import Delete from '../delete/Delete.svelte';
  import './Sidebar.css';

  let users = [];
  let chats = [];
  let showDelete = false;
  let chatToDelete = null;
  let unsubscribeFromChats = null;

  usersStore.subscribe(value => users = value);
  chatsStore.subscribe(value => chats = value);

  onMount(async () => {
    if ($currentUser) {
      await loadUsers(pb, $currentUser);
      await loadChats(pb, $currentUser);

      unsubscribeFromChats = await pb.collection('chats').subscribe('*', ({ action, record }) => {
        if (action === 'delete') {
          chatsStore.update(chats => chats.filter(chat => chat.id !== record.id));
          selectedChatStore.update(selectedChat => selectedChat?.id === record.id ? null : selectedChat);
        } else if (action === 'create' && record.users.includes($currentUser.id)) {
          pb.collection('chats').getOne(record.id, { expand: 'users' })
            .then(updatedChat => {
              chatsStore.update(chats => [...chats, updatedChat]);
            })
            .catch(() => {});
        }
      });
    }
  });

  onDestroy(() => {
    if (unsubscribeFromChats) unsubscribeFromChats();
  });

  async function ensureChatExists(user) {
    if (!$currentUser) return;  

    const existingChat = chats.find(chat =>
      chat.expand?.users?.some(u => u.id === user.id) &&
      chat.expand?.users?.some(u => u.id === $currentUser.id)
    );

    if (existingChat) {
      updateSelectedChat(existingChat);
    } else {
      try {
        const newChat = await pb.collection('chats').create({ users: [$currentUser.id, user.id] });
        await loadChats(pb, $currentUser);  
        const updatedChat = await pb.collection('chats').getOne(newChat.id, { expand: 'users' });
        updateSelectedChat(updatedChat);
      } catch (err) {
        
      }
    }
  }

  async function deleteChat(chatId) {
    try {
      const messages = await pb.collection('messages').getList(1, 50, { filter: `chatid="${chatId}"`, autoCancel: false });

      for (let message of messages.items) {
        try {
          await pb.collection('messages').delete(message.id);
        } catch (err) {
          if (err.status !== 404) {
            
          }
        }
      }

      await pb.collection('chats').delete(chatId);
      await loadChats(pb, $currentUser);
    } catch (err) {
      if (err.status !== 404) {
        
      }
    } finally {
      showDelete = false;
    }
  }

  function confirmDelete(chat) {
    chatToDelete = chat;
    showDelete = true;
  }

  function cancelDelete() {
    chatToDelete = null;
    showDelete = false;
  }
</script>

<div class="sidebar">
  <h1 class="app-heading">Message Mate</h1>

  <h3 class="users-heading">Registered USERS</h3>
  {#each users as user (user.id)}
    <button class="user-item" on:click={() => ensureChatExists(user)}>
      <img src={getAvatarUrl(user.id)} alt="avatar" class="avatar" />
      <span class="user-name">{user.username || user.email}</span>
    </button>
  {/each}

  <h3 class="chats-heading">Your CHATS</h3>
  {#each chats as chat (chat.id)}
    <button class="chat-item" on:click={() => updateSelectedChat(chat)}>
      {#if chat.expand?.users && chat.expand.users.length > 0}
        {#each chat.expand.users as user}
          {#if user.id !== $currentUser?.id}  
            <img src={getAvatarUrl(user.id)} alt="avatar" class="avatar" />
            <span class="user-name">{user.username || user.email}</span>
          {/if}
        {/each}
      {/if}
      <button on:click|stopPropagation={() => confirmDelete(chat)} class="delete-icon">🗑️</button>
    </button>
  {/each}

  {#if showDelete}
    <Delete
      message="Are you sure you want to delete this chat?"
      on:confirm={() => deleteChat(chatToDelete.id)}
      on:cancel={cancelDelete}
    />
  {/if}
</div>
