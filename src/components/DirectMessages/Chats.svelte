<script>
	import { chatContacts, selectedChat } from '$lib/globals/SocialData';
	import { onMount } from 'svelte';
	import { backendURL } from '../../utils/constants';
	import ProfileIcon from '../Profile/ProfileIcon.svelte';
	import { isSuccess } from '../../utils/status';
	import { goto } from '$app/navigation';
	import { getRequest, postRequest } from '../../utils/fetchers';

	let loading = $state(true);

	async function fetchSocialData() {
		let res = await getRequest('/chat/list');

		let data = await res.json();

		$chatContacts = data.content;
		// console.log($chatContacts);

		loading = false;
	}

	onMount(fetchSocialData);

	async function navigateToChat(id) {
		let res = await postRequest('/chat/', { targetUser: { id: id } });

		let data = await res.json();
		if (isSuccess(data.status)) {
			goto(`/app/chat/${data.content.id}`);
		}
	}
</script>

{#if !loading}
	{#if $chatContacts.length >= 1}
		{#each $chatContacts as chatContact}
			{@render Contact(chatContact, chatContact.participants[0].user)}
		{/each}
	{:else}
		<div class="flex h-full w-full flex-col items-center justify-center">
			<p class="text-shade-600 text-center text-lg font-semibold">It's so quiet here…</p>
			<p class="text-shade-600 text-center">Break the silence and chat!</p>
		</div>
	{/if}
{:else}
	<div class="flex h-full w-full flex-col items-center justify-center">
		<div class="loader"></div>
	</div>
{/if}

{#snippet Contact(chat, user)}
	<button
		class={`hover:bg-shade-700 ${$selectedChat == chat.id ? 'bg-shade-750' : ''} flex w-[97%] cursor-pointer items-center gap-3.5 rounded-md p-2 transition-all duration-300`}
		onclick={() => navigateToChat(user.id)}
	>
		<div class="h-[35px] w-[35px]">
			<ProfileIcon statusIndicator={true} />
		</div>
		<div class="flex flex-col items-start">
			<p class="text-shade-600 text-sm">{user.displayName}</p>
			<!-- <p class="text-shade-600 text-xs">{username}</p> -->
		</div>
	</button>
{/snippet}
