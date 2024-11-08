import { pb } from './pocketbase';
import { selectedChatStore } from './store';
import { push } from 'svelte-spa-router';

export function signOut() {
  pb.authStore.clear();
  selectedChatStore.set(null);
  push('/login');
}