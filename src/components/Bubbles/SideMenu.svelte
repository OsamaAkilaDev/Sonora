<script>
	import { sidebar } from '../../utils/Sidebar.svelte';
	import FriendsMenu from '../SideMenu/Friends/FriendsMenu.svelte';
	import Notifications from '../SideMenu/Notifications.svelte';
	import Options from '../SideMenu/Options.svelte';
</script>

{#if sidebar.type == 'Friends'}
	<FriendsMenu />
{:else if sidebar.type == 'Notifications'}
	<Notifications />
{:else if sidebar.type == 'Options'}
	<Options />
{/if}
