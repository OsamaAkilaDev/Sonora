<script>
	import { socialIcons } from '$lib/icons';
	import ProfileIcon from '../Profile/ProfileIcon.svelte';
	import Archive from '../DirectMessages/Archive.svelte';
	import Chats from '../DirectMessages/Chats.svelte';
	import TabBar from '../Buttons/TabBar.svelte';

	let categories = [
		{ name: 'Chats', icon: socialIcons.directMessages, element: Chats },
		{ name: 'Archive', icon: socialIcons.archive, element: Archive }
	];

	let selectedCategory = $state(0);
	let DisplayedCategory = $derived(categories[selectedCategory].element);
</script>

<aside class="bubble col-start-0 max-h-full min-w-[270px] overflow-hidden p-2">
	<TabBar {categories} bind:selector={selectedCategory} />
	<div class=" flex h-[calc(100%-53.5px)] max-h-[calc(100%-53.5px)] flex-col gap-2 overflow-y-auto">
		<DisplayedCategory />
	</div>
</aside>

{#snippet Contact(name)}
	<button
		class="hover:bg-shade-700 flex w-[97%] cursor-pointer items-center gap-4 rounded-md p-2 transition-all duration-300"
	>
		<div class="h-[35px] w-[35px]">
			<ProfileIcon />
		</div>
		<p class="text-shade-600">{name}</p>
	</button>
{/snippet}
