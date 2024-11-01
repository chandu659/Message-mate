<script>
  import { createEventDispatcher } from 'svelte';
  import './Delete.svelte.css';

  const dispatch = createEventDispatcher();
  export let message = "Are you sure you want to delete this chat?";

  function handleConfirm() {
    dispatch('confirm');
  }

  function handleCancel() {
    dispatch('cancel');
  }
</script>

<div class="overlay">
  <div class="dialog">
    <p>{message}</p>
    <button on:click={handleConfirm} class="confirm-button">Delete</button>
    <button on:click={handleCancel} class="cancel-button">Cancel</button>
  </div>
</div>