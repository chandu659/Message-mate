<script lang='js'>
  import Login from "./lib/Login.svelte";
  import Chat from "./lib/Chat.svelte";
  import Sidebar from "./lib/Sidebar.svelte";
  import Header from "./lib/Header.svelte"; 
  import { currentUser } from "./lib/pocketbase";
</script>

<Login/>

{#if $currentUser}
  <Header />
  
  <div class="app-layout">
    <Sidebar />
    <Chat />
  </div>
{/if}


