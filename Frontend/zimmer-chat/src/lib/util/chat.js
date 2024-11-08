import { usersStore, chatsStore, messagesStore } from '../store';

export async function loadUsers(pb, currentUser) {
  try {
    const userList = await pb.collection('users').getList(1, 50, {autoCancel: false});
    usersStore.set(userList.items.filter(user => user.id !== currentUser.id)); 
  } catch (err) {
    
  }
}

export async function loadChats(pb, currentUser) {
  try {
    const chatList = await pb.collection('chats').getList(1, 50, {
      filter: `users ~ "${currentUser.id}"`,
      expand: 'users',
    }, { autoCancel: false});
    chatsStore.set(chatList.items); 
  } catch (err) {
    
  }
}

export async function loadMessages(pb, chatId) {
  try {
    const messageList = await pb.collection('messages').getList(1, 50, {
      filter: `chatid="${chatId}"`,
      expand: 'user',
      sort: 'created',
    });
    messagesStore.set(messageList.items);
  } catch (err) {
    
  }
}

export async function sendMessage(pb, currentUser, selectedChat, text) {
  if (!text.trim() || !selectedChat) return;

  const data = {
    Text: text,
    chatid: selectedChat.id,
    user: currentUser.id,
  };

  try {
    await pb.collection('messages').create(data);
    loadMessages(pb, selectedChat.id); 
  } catch (err) {
    
  }
}


