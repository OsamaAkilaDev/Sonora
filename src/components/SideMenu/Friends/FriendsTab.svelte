<script>
	import { friends } from '$lib/globals/SocialData';
	import ProfileIcon from '../../Profile/ProfileIcon.svelte';
</script>

{#if $friends.length >= 1}
	<p class="text-shade-600 mt-0.5 mb-1 ml-1.5 text-sm">Friends ({$friends.length})</p>
{/if}

<div class="flex h-[calc(100%-77.5px)] max-h-[calc(100%-77.5px)] flex-col gap-2 overflow-y-auto">
	{#if $friends.length >= 1}
		{#each $friends as friend}
			{@render Contact(friend.displayName, friend.username)}
		{/each}
	{:else}
		<div class="flex h-full w-full flex-col items-center justify-center">
			<p class="text-shade-600 text-center text-lg font-semibold">No friends yet?</p>
			<p class="text-shade-600 text-center">Let’s change that!</p>
		</div>
	{/if}
</div>

{#snippet Contact(displayName, username)}
	<button
		class="hover:bg-shade-700 flex w-[97%] cursor-pointer items-center gap-4 rounded-md p-2 transition-all duration-300"
	>
		<div class="h-[35px] w-[35px]">
			<ProfileIcon />
		</div>
		<div class="flex flex-col items-start">
			<p class="text-shade-600 text-sm">{displayName}</p>
			<!-- <p class="text-shade-600 text-xs">{username}</p> -->
		</div>
	</button>
{/snippet}
