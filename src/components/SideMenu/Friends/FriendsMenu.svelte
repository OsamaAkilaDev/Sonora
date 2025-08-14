<script>
	import { socialIcons } from '$lib/icons';
	import TabBar from '../../Buttons/TabBar.svelte';
	import BlockedFriendsTab from './BlockedFriendsTab.svelte';
	import FriendsTab from './FriendsTab.svelte';
	import PendingRequestsTab from './PendingRequestsTab.svelte';

	let categories = [
		{ name: 'Friends', icon: socialIcons.friends, element: FriendsTab },
		{ name: 'Pending', icon: socialIcons.pending, element: PendingRequestsTab }
		// { name: 'Blocked', icon: socialIcons.blocked, element: BlockedFriendsTab }
	];

	let selectedCategory = $state(0);
	let DisplayedTab = $derived(categories[selectedCategory].element);
</script>

<aside class="h-full w-full p-2">
	<TabBar {categories} bind:selector={selectedCategory} />

	<DisplayedTab />
</aside>
