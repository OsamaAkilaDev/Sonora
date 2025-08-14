<script>
	import { navigationBarIcons, socialIcons, utilitiesIcons } from '$lib/icons';
	import ProfileIconButton from '../Profile/ProfileIconButton.svelte';

	let buttons = {
		voiceCall: {
			icon: socialIcons.voiceCall,
			name: 'Voice Call',
			href: '/'
		},
		videoCall: {
			icon: socialIcons.videoCall,
			name: 'Video Call',
			href: '/'
		}
	};
</script>

<nav class="flex h-[50px] w-full items-center justify-between p-2 px-2">
	<div class="flex items-center gap-3">
		<div class="h-[30px] w-[30px]"><ProfileIconButton /></div>
		<p class="text-shade-600 text-sm font-[420]">Osama</p>
	</div>

	<div class="flex h-5 gap-4">
		{@render navigationButton(buttons.videoCall)}
		{@render navigationButton(buttons.voiceCall)}
		<!-- {@render navigationButton({
			name: 'Search',
			icon: utilitiesIcons.search,
			href: '/'
		})} -->

		{@render navigationButton({
			name: 'Options',
			icon: utilitiesIcons.options,
			href: '/'
		})}
	</div>
</nav>
<div class="flex w-full items-center justify-center">
	<div class="bg-shade-700 h-[1.5px] w-[calc(100%-16px)] rounded-2xl"></div>
</div>

{#snippet navigationButton(button)}
	<a
		class="text-shade-600 hover:text-shade-500 w-[20px]"
		href={button.href}
		aria-label={button.name}
	>
		{@html button.icon}
	</a>
{/snippet}
