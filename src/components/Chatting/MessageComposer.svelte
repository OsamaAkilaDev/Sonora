<script>
	import { socialIcons } from '$lib/icons';
</script>

<div class="flex w-full items-center justify-center">
	<div class="bg-shade-700 h-[1.5px] w-[calc(100%-16px)] rounded-2xl"></div>
</div>
<div class="flex h-[50px] max-h-20 flex-row gap-2 px-[18px]">
	<textarea
		name=""
		id=""
		placeholder="Type your message here"
		class="text-shade-500 text-4 grow resize-none bg-transparent py-[13px] outline-0"
	></textarea>
	<div class="flex h-full flex-row gap-3">
		{@render navigationButton(socialIcons.emoji, 'Emoji menu')}
		{@render navigationButton(socialIcons.send, 'Send message')}
	</div>
</div>

{#snippet navigationButton(icon, name)}
	<button class="text-shade-600 hover:text-shade-500 w-[20px] cursor-pointer" aria-label={name}>
		{@html icon}
	</button>
{/snippet}
