<!-- <svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head> -->

<script>
	import { onMount } from 'svelte';
	import DirectMessagesBar from '../../components/Bubbles/DirectMessagesBar.svelte';
	import NavigationBar from '../../components/Bubbles/NavigationBar.svelte';
	import { validateTokenThenGoto } from '../../utils/auth';
	import { Toaster } from 'svelte-hot-french-toast';
	import { sidebar } from '../../utils/Sidebar.svelte';
	import SideMenu from '../../components/Bubbles/SideMenu.svelte';
	import { initSocket } from '$lib/sockets/socketClient';

	let { children } = $props();

	onMount(async () => {
		const path = window.location.pathname;
		const userData = await validateTokenThenGoto(path, '/login');
		initSocket(userData);
	});
</script>

<div class="bg-shade-900 flex h-full w-full flex-col gap-2 p-2">
	<NavigationBar {sidebar} />

	<div class="grid-layout">
		<DirectMessagesBar />
		{@render children?.()}

		{#if sidebar.isActive}
			<div class="bubble min-w-[270px]">
				<SideMenu />
			</div>
		{/if}
	</div>

	<Toaster />
</div>
