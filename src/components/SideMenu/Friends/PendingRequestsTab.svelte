<script>
	import { socialIcons, utilitiesIcons } from '$lib/icons';
	import ExpandableList from '../../Buttons/ExpandableList.svelte';
	import InputField from '../../Inputs/InputField.svelte';
	import ProfileIcon from '../../Profile/ProfileIcon.svelte';
	import { backendURL } from '../../../utils/constants';
	import { isSuccess } from '../../../utils/status';
	import { iconToast, errorToast, successToast } from '../../../utils/toasts';
	import { error } from '@sveltejs/kit';
	import RequestCard from './RequestCard.svelte';
	import { receivedRequests, sentRequests } from '$lib/globals/SocialData';
	import { postRequest } from '../../../utils/fetchers';

	let { loadData } = $props();

	async function onSubmit(e) {
		e.preventDefault();
		// console.log(e);
		let formData = new FormData(e.target);

		let username = formData.get('username');
		// console.log(username);

		if (!username) return;

		let res = await postRequest('/relation/send-friendship-request', {
			username: username
		});

		let data = await res.json();

		// console.log(data);

		if (isSuccess(data.status)) successToast('Friend Request Sent!');
		else errorToast(data.content);
	}
</script>

<form onsubmit={(e) => onSubmit(e)} class="flex h-8 gap-2">
	<div class="bg-shade-700 text-shade-600 flex h-full w-full items-center gap-1.5 rounded-sm p-2">
		<div class="h-full">
			{@html socialIcons.username}
		</div>
		<input
			id="username"
			name="username"
			placeholder="Enter username to add"
			class="h-full w-full text-sm outline-none"
		/>
	</div>
	<button class="cyan-btn aspect-square h-full rounded-sm p-1.5">{@html utilitiesIcons.add}</button>
</form>
<!-- <p class="text-rednor-700 mt-1.5 text-sm"></p> -->

<div
	class="mt-2.5 flex h-[calc(100%-95.5px)] max-h-[calc(100%-95.5px)] flex-col gap-2 overflow-y-auto"
>
	<div class="mt-0.5 flex flex-col gap-3">
		<ExpandableList name="Received" count={$receivedRequests.length}>
			{#each $receivedRequests as request}
				<RequestCard
					displayName={request.requester.displayName}
					username={request.requester.username}
					requestId={request.id}
					isSent={false}
				/>
			{/each}
		</ExpandableList>

		<ExpandableList name="Sent" count={$sentRequests.length}>
			{#each $sentRequests as request}
				<RequestCard
					displayName={request.receiver.displayName}
					username={request.receiver.username}
					requestId={request.id}
					isSent={true}
				/>
			{/each}
		</ExpandableList>
	</div>
</div>
