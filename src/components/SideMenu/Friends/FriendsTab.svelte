<script>
	import { goto } from '$app/navigation';
	import { friends, selectedChat } from '$lib/globals/SocialData';
	import { utilitiesIcons } from '$lib/icons';
	import { backendURL } from '../../../utils/constants';
	import { postRequest } from '../../../utils/fetchers';
	import { isSuccess } from '../../../utils/status';
	import ProfileIcon from '../../Profile/ProfileIcon.svelte';

	let { loadData } = $props();

	async function navigateToChat(friend) {
		let res = await postRequest('/chat/', { targetUser: { id: friend.id } });

		let data = await res.json();
		if (isSuccess(data.status)) {
			goto(`/app/chat/${data.content.id}`);
		}
	}
</script>

{#if loadData}
	{#if $friends.length >= 1}
		<p class="text-shade-600 mt-0.5 mb-1 ml-1.5 text-sm">Friends ({$friends.length})</p>
	{/if}

	<div class="flex h-[calc(100%-77.5px)] max-h-[calc(100%-77.5px)] flex-col gap-2 overflow-y-auto">
		{#if $friends.length >= 1}
			{#each $friends as friend}
				{@render Contact(friend)}
			{/each}
		{:else}
			<div class="flex h-full w-full flex-col items-center justify-center">
				<p class="text-shade-600 text-center text-lg font-semibold">No friends yet?</p>
				<p class="text-shade-600 text-center">Let’s change that!</p>
			</div>
		{/if}
	</div>
{:else}
	<div class="flex h-full w-full flex-col items-center justify-center">
		<div class="loader"></div>
	</div>
{/if}

{#snippet Contact(friend)}
	<button
		class="hover:bg-shade-700 flex w-[97%] cursor-pointer items-center gap-3.5 rounded-md p-2 transition-all duration-300"
		onclick={() => navigateToChat(friend)}
	>
		<div class="h-[35px] w-[35px]">
			<ProfileIcon />
		</div>
		<div class="flex flex-col items-start">
			<p class="text-shade-600 text-sm">{friend.displayName}</p>
			<!-- <p class="text-shade-600 text-xs">{username}</p> -->
		</div>
	</button>
{/snippet}
