<script>
	import { socialIcons } from '$lib/icons';
	import ProfileIcon from '../Profile/ProfileIcon.svelte';

	let categories = [
		{ name: 'Chats', icon: socialIcons.directMessages },
		{ name: 'Friends', icon: socialIcons.friends },
		{ name: 'Archive', icon: socialIcons.archive }
	];

	let selectedCategory = $state(0);
</script>

<aside class="bubble max-h-full overflow-hidden p-2">
	<nav class="flex h-[32px] w-full gap-2 rounded-sm">
		{#each categories as category, i}
			{@render CategorySection(category, i)}
		{/each}
	</nav>

	<div class="flex w-full justify-center">
		<div class="bg-shade-700 my-2.5 h-[1.5px] w-[100%] rounded-2xl"></div>
	</div>

	<div class=" flex max-h-[calc(100%-53.5px)] flex-col gap-2 overflow-y-auto">
		{@render Contact('Osama')}
		{@render Contact('Mahmoud')}
		{@render Contact('Khamis')}
		{@render Contact('Salem')}
		{@render Contact('Ibrahim')}
		{@render Contact('Akila')}
		{@render Contact('Ahmad')}
		{@render Contact('Ayman')}
		{@render Contact('Mohammad')}
		{@render Contact('Sami')}
		{@render Contact('Adbullah')}
		{@render Contact('Khaled')}
		{@render Contact('Waleed')}
		{@render Contact('Adel')}
		{@render Contact('Waleed')}
		{@render Contact('Loai')}
		{@render Contact('Saleh')}
		{@render Contact('Salah')}
		{@render Contact('Zaki')}
	</div>
</aside>

{#snippet CategorySection(category, index)}
	<button
		onclick={() => (selectedCategory = index)}
		class="btn flex {selectedCategory == index
			? 'grow'
			: ''} cursor-pointer items-center justify-center gap-2 rounded-sm p-[6px] transition-all duration-300"
	>
		<div class="text-shade-600 h-[20px] w-[20px]">
			{@html category.icon}
		</div>

		{#if selectedCategory == index}
			<p class="text-shade-600 text-sm font-[470]">{category.name}</p>
		{/if}
	</button>
{/snippet}

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
