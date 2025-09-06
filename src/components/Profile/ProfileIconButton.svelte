<script>
	import defaultImage from '$lib/images/default_pfp.png';
	import ProfileCard from './ProfileCard.svelte';

	let { img = defaultImage, name = 'username placeholder' } = $props();

	let profileCardShown = $state(false);

	function triggerCard() {
		profileCardShown = !profileCardShown;
	}
</script>

<button class="relative flex h-full w-full cursor-pointer items-center" onclick={triggerCard}>
	<img src={img} alt={name} class="h-full w-full rounded-full" />
	<div
		class="border-shade-800 absolute -right-[3px] -bottom-[3px] h-[40%] w-[40%] rounded-2xl border-[3px] border-solid bg-green-500"
	></div>
</button>
{#if profileCardShown}
	<ProfileCard {triggerCard} />
{/if}
