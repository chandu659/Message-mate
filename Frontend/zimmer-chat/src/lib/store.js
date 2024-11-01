import { writable } from 'svelte/store';

export const usersStore = writable([]);
export const chatsStore = writable([]);
export const selectedChatStore = writable(null);
export const messagesStore = writable([]);


export function updateSelectedChat(chat) {
  selectedChatStore.set(chat);
}
