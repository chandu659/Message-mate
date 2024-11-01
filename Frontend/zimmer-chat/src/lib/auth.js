import { pb } from './pocketbase';

export function signOut() {
  pb.authStore.clear();
}
