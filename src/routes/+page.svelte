<script>
	import ChatBox from '../components/Bubbles/ChatBox.svelte';
	import DirectMessagesBar from '../components/Bubbles/DirectMessagesBar.svelte';
	import NavigationBar from '../components/Bubbles/NavigationBar.svelte';
</script>

<div class="bg-shade-900 grid-layout h-full w-full">
	<NavigationBar />
	<DirectMessagesBar />
	<ChatBox />
</div>
