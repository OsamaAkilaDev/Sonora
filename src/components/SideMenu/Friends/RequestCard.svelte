<script>
	import { utilitiesIcons } from '$lib/icons';
	import { backendURL } from '../../../utils/constants';
	import { isSuccess } from '../../../utils/status';
	import { errorToast, iconToast, successToast } from '../../../utils/toasts';
	import ProfileIcon from '../../Profile/ProfileIcon.svelte';

	let { displayName, username, requestId, isSent } = $props();

	async function cancelFriendRequest(id) {
		// console.log('cancel');
		let res = await fetch(backendURL + '/relation/cancel-friendship-request', {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({
				relationId: id
			})
		});

		let data = await res.json();
		// console.log(data);

		if (isSuccess(data.status)) iconToast(data.content, '🗑️');
		else errorToast(data.content);
	}

	async function acceptFriendRequest(id) {
		// console.log('cancel');
		let res = await fetch(backendURL + '/relation/accept-friendship-request', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({
				relationId: id
			})
		});

		let data = await res.json();
		// console.log(data);

		if (isSuccess(data.status)) successToast(data.content);
		else errorToast(data.content);
	}

	async function rejectFriendRequest(id) {
		// console.log('cancel');
		let res = await fetch(backendURL + '/relation/reject-friendship-request', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			credentials: 'include',
			body: JSON.stringify({
				relationId: id
			})
		});

		let data = await res.json();
		// console.log(data);

		if (isSuccess(data.status)) iconToast(data.content, '🛑');
		else errorToast(data.content);
	}
</script>

<div class="item flex h-13 w-full items-center gap-3.5 rounded-md p-2 transition-all duration-300">
	<div class="h-[35px] w-[35px]">
		<ProfileIcon statusIndicator={false} />
	</div>

	<!-- Text block takes remaining space -->
	<div class="flex min-w-0 flex-1 flex-col">
		<p class="text-shade-600 truncate text-sm">{displayName}</p>
		<p class="text-shade-600 truncate text-xs">{username}</p>
	</div>

	<!-- Action buttons -->
	<div class="ml-auto flex h-full items-center gap-1.5 p-0.5">
		{#if isSent}
			{@render ActionButton(utilitiesIcons.cancel, 'Cancel', () => cancelFriendRequest(requestId))}
		{:else}
			{@render ActionButton(utilitiesIcons.checkmark, 'Accept', () =>
				acceptFriendRequest(requestId)
			)}
			{@render ActionButton(utilitiesIcons.cross, 'Deny', () => rejectFriendRequest(requestId))}
		{/if}
	</div>
</div>

{#snippet ActionButton(icon, name, action)}
	<button
		class="bg-shade-800 hover:bg-shade-700 active:bg-shade-650 text-shade-600 flex aspect-square h-full cursor-pointer items-center justify-center rounded-full p-1.5"
		onclick={action}
		aria-label={name}
	>
		{@html icon}
	</button>
{/snippet}
