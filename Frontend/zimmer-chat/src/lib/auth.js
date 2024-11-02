import { pb } from './pocketbase';
import { selectedChatStore } from './store';

export function signOut() {
  pb.authStore.clear();
  selectedChatStore.set(null);
}
