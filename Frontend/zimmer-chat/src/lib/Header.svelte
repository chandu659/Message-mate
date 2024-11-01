<script lang="js">
  import { currentUser } from './pocketbase';
  import { signOut } from './auth';
  import './Header.svelte.css';

  $: initials = $currentUser?.username ? $currentUser.username.slice(0, 2).toUpperCase() : '';
</script>

{#if $currentUser}    
      <div class="user-info">
        <div class="avatar">{initials}</div>
        <button on:click={signOut}>Sign Out</button>
      </div>
{/if}

