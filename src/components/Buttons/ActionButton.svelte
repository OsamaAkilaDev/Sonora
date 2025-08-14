<script>
	let { name, icon, Component } = $props();

	let isActivated = $state(false);

	function toggleActivation() {
		isActivated = !isActivated;
	}
</script>

<button
	aria-label={name}
	class="text-shade-600 hover:text-shade-500 h-[20px] w-[20px] hover:cursor-pointer"
	onclick={() => (isActivated = true)}
>
	{@html icon}
</button>

{#if isActivated}
	<Component triggerCard={toggleActivation} />
{/if}
