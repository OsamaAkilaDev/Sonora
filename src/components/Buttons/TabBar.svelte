<script>
	import TabButton from './TabButton.svelte';

	let { categories, selector = $bindable() } = $props();
</script>

<nav class="flex h-[32px] w-full gap-2 rounded-sm">
	{#each categories as category, index}
		<TabButton {category} selectedCategory={selector} {index} action={() => (selector = index)} />
	{/each}
</nav>

<div class="flex w-full justify-center">
	<div class="bg-shade-700 my-2.5 h-[1.5px] w-[100%] rounded-2xl"></div>
</div>
