<script lang="js">
  import Router from "svelte-spa-router";
  import Login from "./routes/Login.svelte";
  import Chat from "./routes/Chat.svelte";

  let routes ={
    "/login": Login, 
    "/chat" : Chat
  }
</script>

<Router {routes} />
