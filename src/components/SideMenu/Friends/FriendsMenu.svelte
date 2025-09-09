<script>
	import { updateData } from '$lib/globals/SocialData';
	import { socialIcons } from '$lib/icons';
	import { onMount } from 'svelte';
	import { backendURL } from '../../../utils/constants';
	import TabBar from '../../Buttons/TabBar.svelte';
	import BlockedFriendsTab from './BlockedFriendsTab.svelte';
	import FriendsTab from './FriendsTab.svelte';
	import PendingRequestsTab from './PendingRequestsTab.svelte';
	import { getRequest } from '../../../utils/fetchers';

	let categories = [
		{ name: 'Friends', icon: socialIcons.friends, element: FriendsTab },
		{ name: 'Pending', icon: socialIcons.pending, element: PendingRequestsTab }
		// { name: 'Blocked', icon: socialIcons.blocked, element: BlockedFriendsTab }
	];

	let selectedCategory = $state(0);
	let DisplayedTab = $derived(categories[selectedCategory].element);

	let loadData = $state(false);

	async function fetchSocialData() {
		let res = await getRequest('/relation/friends');

		let data = await res.json();

		let res2 = await getRequest('/relation/friend-requests');

		let data2 = await res2.json();

		updateData({
			friends: data.content,
			receivedRequests: data2.content.receivedFriendships,
			sentRequests: data2.content.requestedFriendships
		});

		loadData = true;
	}
	onMount(fetchSocialData);
</script>

<aside class="h-full w-full p-2">
	<TabBar {categories} bind:selector={selectedCategory} />

	<DisplayedTab {loadData} />
</aside>
