<script lang='js'>
  import Login from "./lib/Login.svelte";
  import Chat from "./lib/Chat.svelte";
  import Sidebar from "./lib/Sidebar.svelte";
  import { currentUser } from "./lib/pocketbase";
  import Signout from "./lib/Signout.svelte";
</script>

<Login/>

{#if $currentUser}
  <Signout />
  
  <div class="app-layout">
    <Sidebar />
    <Chat />
  </div>
{/if}


