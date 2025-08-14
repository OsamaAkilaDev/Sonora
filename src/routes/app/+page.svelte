<script>
	import { onMount } from 'svelte';
	import ChatBox from '../../components/Bubbles/ChatBox.svelte';
	import DirectMessagesBar from '../../components/Bubbles/DirectMessagesBar.svelte';
	import NavigationBar from '../../components/Bubbles/NavigationBar.svelte';
	import { validateTokenThenGoto } from '../../utils/auth';
	import { Toaster } from 'svelte-hot-french-toast';
	import { sidebar } from '../../utils/Sidebar.svelte';
	import SideMenu from '../../components/Bubbles/SideMenu.svelte';

	onMount(() => validateTokenThenGoto('/app', '/login'));
</script>

<div class="bg-shade-900 flex h-full w-full flex-col gap-2 p-2">
	<NavigationBar {sidebar} />

	<div class="grid-layout">
		<DirectMessagesBar />
		<ChatBox />

		{#if sidebar.isActive}
			<div class="bubble min-w-[270px]">
				<SideMenu />
			</div>
		{/if}
	</div>

	<Toaster />
</div>
