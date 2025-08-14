<script>
	let { category, selectedCategory, index, action } = $props();
</script>

<button
	onclick={action}
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
