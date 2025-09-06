<script>
	import pfp from '$lib/images/pfp.png';
	import pfp2 from '$lib/images/pfp2.png';
	import ChatHeader from '../Chatting/ChatHeader.svelte';
	import ChatMessage from '../Chatting/ChatMessage.svelte';
	import MessageComposer from '../Chatting/MessageComposer.svelte';
	import { sidebar } from '../../utils/Sidebar.svelte';
	import { socialIcons } from '$lib/icons';
	import { activeChatData } from '$lib/globals/SocialData';
</script>

<main
	class={`bubble max-h-full overflow-hidden`}
	class:col-span-1={sidebar.isActive}
	class:col-span-2={!sidebar.isActive}
>
	<ChatHeader info={$activeChatData.participants[0].user} />
	<div class="h-[calc(100%-103px)] py-2.5 pr-2 pl-1.5">
		<div class="flex max-h-full flex-col-reverse gap-3 overflow-x-hidden overflow-y-auto px-3">
			{#if $activeChatData.messages.length >= 1}
				{#each [...$activeChatData.messages].reverse() as message}
					<ChatMessage
						img={message.sender.profilePicture}
						isoString={message.createdAt}
						username={message.sender.displayName}
						msg={message.content}
					/>
				{/each}
			{:else}
				<div class="flex h-screen flex-col items-center justify-center">
					<!-- <div class="text-shade-640 drop-shadow-3xl relative max-w-[210px] max-md:max-w-[150px]">
						{@html socialIcons.newChat}
					</div> -->

					<div class="flex w-full flex-col items-center justify-center gap-0">
						<p class="text-shade-600 text-center text-2xl font-medium max-md:text-[18px]">
							No messages yet
						</p>
						<p class="text-shade-600 max-w-[30%] text-center text-xl max-md:text-[18px]">
							Be the first to say hi!
						</p>
					</div>
				</div>
			{/if}
		</div>
	</div>
	<MessageComposer chatId={$activeChatData.id} />
</main>
