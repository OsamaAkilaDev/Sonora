<script>
	import defaultImage from '$lib/images/default_pfp.png';
	import ProfileCard from './ProfileCard.svelte';

	let {
		img = defaultImage,
		name = 'username placeholder',
		borderWidth = 3,
		borderColor = 'border-shade-800',
		statusIndicator = false
	} = $props();

	let profileCardShown = $state(false);

	function triggerCard() {
		profileCardShown = !profileCardShown;
	}
</script>

<div class="relative flex h-full w-full items-center">
	<img src={img} alt={name} class="h-full w-full rounded-full" />

	{#if statusIndicator}
		<div
			class="{borderColor} absolute -right-[3px] -bottom-[3px] h-[clamp(10px,40%,35px)] w-[clamp(10px,40%,35px)] rounded-full border-[{borderWidth}px] border-solid bg-green-500"
		></div>
	{/if}
</div>
{#if profileCardShown}
	<ProfileCard {triggerCard} />
{/if}
