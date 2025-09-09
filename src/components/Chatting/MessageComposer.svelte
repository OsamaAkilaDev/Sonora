<script>
	import { socialIcons } from '$lib/icons';
	import { backendURL } from '../../utils/constants';
	import { postRequest } from '../../utils/fetchers';
	import { isSuccess } from '../../utils/status';

	let { chatId } = $props();

	let msgText = $state('');

	async function onSubmit(e) {
		e.preventDefault();

		if (!msgText) return;

		// console.log(msgText);

		let res = await postRequest('/chat/message', {
			chatId: chatId,
			messageContent: msgText
		});

		let data = await res.json();

		if (isSuccess(data.status)) msgText = '';
	}

	function handleKeydown(e) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			onSubmit(e);
		}
	}
</script>

<div class="flex w-full items-center justify-center">
	<div class="bg-shade-700 h-[1.5px] w-[calc(100%-16px)] rounded-2xl"></div>
</div>
<form class="flex h-[50px] max-h-20 flex-row gap-2 px-[18px]" onsubmit={(e) => onSubmit(e)}>
	<textarea
		bind:value={msgText}
		name="msg-composer"
		id="msg-composer"
		placeholder="Type your message here"
		class="text-shade-500 text-4 grow resize-none bg-transparent py-[13px] outline-0"
		onkeydown={(e) => handleKeydown(e)}
	></textarea>
	<div class="flex h-full flex-row items-center gap-3">
		{@render navigationButton(socialIcons.emoji, 'Emoji menu')}
		<button
			type="submit"
			class="text-shade-600 hover:text-shade-500 h-[20px] w-[20px] cursor-pointer"
			aria-label="send message"
		>
			{@html socialIcons.send}
		</button>
	</div>
</form>

{#snippet navigationButton(icon, name)}
	<button
		class="text-shade-600 hover:text-shade-500 h-[20px] w-[20px] cursor-pointer"
		aria-label={name}
	>
		{@html icon}
	</button>
{/snippet}
