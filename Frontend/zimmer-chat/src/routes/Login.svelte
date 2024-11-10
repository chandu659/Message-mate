<script lang="js">
  import { currentUser, pb } from '../lib/pocketbase';
  import { push } from 'svelte-spa-router';

  let username = '';
  let password = '';
  let errorMessage = '';
  let user;

  currentUser.subscribe(value =>{
    user = value;
    if (user){
      push('/chat');
    }
  });

  async function login() {
  errorMessage = '';
  if (!username || !password) {
    errorMessage = 'Username and password cannot be empty';
    return;
  }

  try {
    await pb.collection('users').authWithPassword(username, password);
    currentUser.set(pb.authStore.model);
     push('/chat');

  } catch (error) {
    if (error.message && error.message.includes('Failed to authenticate')) {
      errorMessage = 'The username or password may be incorrect';
    } else {
      errorMessage = 'An error occurred. Please try again later.';
    }
  }
}

  async function signUp() {
    errorMessage = '';
    if (!username || !password) {
      errorMessage = 'Username and password cannot be empty';
      return;
    }

    if (password.length < 8) {
      errorMessage = 'Password must be at least 8 characters long';
      return;
    }

    try {
      const data = {
        username,
        password,
        passwordConfirm: password,
        name: '',
      };
      await pb.collection('users').create(data);
      await login(); 
    } catch (err) {
      errorMessage = 'An error occurred during sign-up. Please try again.';
    }
  }

  // Clear error message when typing in inputs
  function handleInput() {
    errorMessage = '';
  }

</script>

{#if $currentUser}
<!-- <Chat/> -->

{:else}
  <div class="bg-black text-white flex min-h-screen flex-col items-center pt-16 sm:justify-center sm:pt-0">
    <a href="/" aria-label="Home">
      <div class="text-[1.5em] text-[hsl(34,89%,71%)] text-center bg-[#6C78A4] rounded-md mb-5 font-bold tracking-tighter mx-auto flex items-center gap-2 px-8 py-2">
        Message Mate
      </div>
    </a>

    <div class="relative mt-12 w-full max-w-lg sm:mt-10">
      <div class="relative -mb-px h-px w-full bg-gradient-to-r from-transparent via-sky-300 to-transparent"></div>
      <div
        class="mx-5 border dark:border-b-white/50 dark:border-t-white/50 border-b-white/20 sm:border-t-white/20 shadow-[20px_0_20px_20px] shadow-slate-500/10 dark:shadow-white/20 rounded-lg border-white/20 border-l-white/20 border-r-white/20 sm:shadow-sm lg:rounded-xl lg:shadow-none">
        <div class="flex flex-col p-6">
          <p class="text-xl font-semibold leading-6 tracking-tighter">Login</p>
          <p class="mt-1.5 text-sm font-medium text-white/50">Welcome, enter your credentials to continue.</p>
        </div>
        <div class="p-6 pt-0">
          <form on:submit|preventDefault>
            <div>
              <div class="group relative rounded-lg border focus-within:border-sky-200 px-3 pb-1.5 pt-2.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
                <div class="flex justify-between">
                  <label for="username" class="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">Username</label>
                </div>
                <input id="username" type="text" name="username" placeholder="example: Paul" autocomplete="off" bind:value={username} on:input={handleInput}
                  class="block w-full border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 sm:leading-7 text-foreground">
              </div>
            </div>
            <div class="mt-4">
              <div class="group relative rounded-lg border focus-within:border-sky-200 px-3 pb-1.5 pt-2.5 duration-200 focus-within:ring focus-within:ring-sky-300/30">
                <div class="flex justify-between">
                  <label for="password" class="text-xs font-medium text-muted-foreground group-focus-within:text-white text-gray-400">Password</label>
                </div>
                <input id="password" type="password" name="password" bind:value={password} on:input={handleInput}
                  class="block w-full border-0 bg-transparent p-0 text-sm placeholder:text-muted-foreground/90 focus:outline-none focus:ring-0 sm:leading-7 text-foreground">
              </div>
            </div>

            {#if errorMessage}
              <p class="mt-2 text-sm text-red-500">{errorMessage}</p>
            {/if}

            <div class="mt-4 flex items-center justify-end gap-x-2">
              <button on:click={signUp}
                class="inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:ring hover:ring-white h-10 px-4 py-2 duration-200">Sign Up</button>
              <button on:click={login} type="submit"
                class="font-semibold hover:bg-black hover:text-white hover:ring hover:ring-white transition duration-300 inline-flex items-center justify-center rounded-md text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-white text-black h-10 px-4 py-2">Log In</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
{/if}
