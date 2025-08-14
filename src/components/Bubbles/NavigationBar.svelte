<script>
	import { navigationBarIcons } from '$lib/icons';
	import { sidebar } from '../../utils/Sidebar.svelte';
	import BeaconMenu from '../Beacons/BeaconMenu.svelte';
	import ActionButton from '../Buttons/ActionButton.svelte';
	import LogoButton from '../Buttons/LogoButton.svelte';
	import ProfileIconButton from '../Profile/ProfileIconButton.svelte';

	let buttons = {
		home: {
			icon: navigationBarIcons.home,
			name: 'Home',
			href: '/'
		},
		add: {
			icon: navigationBarIcons.add,
			name: 'Add',
			href: '/'
		},
		friends: {
			icon: navigationBarIcons.friends,
			name: 'Friends',
			href: '/'
		},
		notifications: {
			icon: navigationBarIcons.notifications,
			name: 'Notifications',
			href: '/'
		},
		search: {
			icon: navigationBarIcons.search,
			name: 'Search',
			href: '/'
		},
		options: {
			icon: navigationBarIcons.options,
			name: 'Options',
			href: '/options'
		},
		connection: {
			icon: navigationBarIcons.connectionStatus,
			name: 'Connection Status',
			href: '/'
		},
		deafen: {
			icon: navigationBarIcons.undeafened,
			name: 'Deafen',
			href: '/'
		},
		mute: {
			icon: navigationBarIcons.unmuted,
			name: 'Mute',
			href: '/'
		},
		logo: {
			icon: navigationBarIcons.logo,
			name: 'Logo',
			href: '/'
		}
	};
</script>

<nav class="bubble navigation-bar">
	<!-- Left Menu (Navigation: Home, Search, Options) -->
	<div class="navigation-left-menu">
		<LogoButton />
		<div class=" flex h-full items-center">
			<div class="bg-shade-700 h-[85%] w-[1.5px] rounded-2xl"></div>
		</div>
		{@render navigationButton(buttons.connection)}
		{@render navigationButton(buttons.deafen)}
		{@render navigationButton(buttons.mute)}
	</div>

	<!-- Middle Menu (Beacon Menu) -->
	<div class="navigation-middle-menu">
		<!-- <BeaconMenu /> -->
	</div>

	<!-- Right Menu (Callstate: Connectivity, Deafen, Mute) -->
	<div class="navigation-right-menu">
		{@render actionButton(buttons.options)}
		{@render actionButton(buttons.notifications)}
		{@render actionButton(buttons.friends)}

		<div class=" flex h-full items-center">
			<div class="bg-shade-700 h-[85%] w-[1.5px] rounded-2xl"></div>
		</div>
		<div class="h-[35px] w-[35px]">
			<ProfileIconButton />
		</div>
	</div>
</nav>

{#snippet navigationButton(button)}
	<a
		class="text-shade-600 hover:text-shade-500 h-[20px] w-[20px]"
		href={button.href}
		aria-label={button.name}
	>
		{@html button.icon}
	</a>
{/snippet}

{#snippet actionButton(button)}
	<button
		class="hover:text-shade-500 {sidebar.type === button.name && sidebar.isActive
			? 'text-shade-500'
			: 'text-shade-600'} h-[20px] w-[20px] cursor-pointer"
		onclick={() => sidebar.trigger(button.name)}
		aria-label={button.name}
	>
		{@html button.icon}
	</button>
{/snippet}
