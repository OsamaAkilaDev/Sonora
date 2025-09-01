<script>
	import { utilitiesIcons } from '$lib/icons';

	let { children, name, count } = $props();

	let isExpanded = $state(true);
</script>

<div class="flex flex-col gap-0.5">
	<div class="text-shade-600 flex h-5 items-center gap-2">
		<p class="ml-1.5 text-sm">{name} ({count})</p>
		<button
			class="h-full cursor-pointer transition-[rotate]"
			class:rotate-90={!isExpanded}
			onclick={() => (isExpanded = !isExpanded)}
		>
			{@html utilitiesIcons.listExpanded}
		</button>
	</div>

	{#if children.length > 0 && isExpanded}
		<div class="flex flex-col gap-2">
			{@render children()}
		</div>
	{/if}
</div>
