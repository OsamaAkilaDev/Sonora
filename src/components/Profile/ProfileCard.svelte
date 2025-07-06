<script>
	import ProfileBanner from './Profile Card Components/ProfileBanner.svelte';
	import DateJoined from './Profile Card Components/DateJoined.svelte';
	import Username from './Profile Card Components/Username.svelte';

	import pfp from '$lib/images/pfp.png';
	import bnr from '$lib/images/banner.jpeg';
	import Bio from './Profile Card Components/Bio.svelte';

	import { fade, blur } from 'svelte/transition';

	let {
		triggerCard,
		name = 'Osama Akila',
		username = 'Akila2003',
		profileImage = pfp,
		bannerImage = bnr,
		dateJoined = '17 Jul 2018',
		bio = 'Loremw ipsum dolor sit ametey, consectetur adipiscing elit. Nunc sit amet urna in massa fringilla fermentum. Suspendisse ete magna nec neque efficiture aliquame. Maecenasey aliquamer tristique massa in.',
		socials = ['', '', '', '']
	} = $props();
</script>

<div
	transition:fade={{ duration: 100 }}
	aria-label="Profile Card"
	class="bg-shade-700 fixed top-1/2 left-1/2 z-51 flex w-124 -translate-x-1/2 -translate-y-1/2 transform flex-col rounded-xl p-2 shadow-xl drop-shadow-lg"
>
	<ProfileBanner {bnr} {pfp} />
	<DateJoined date={dateJoined} />

	<div class="mb-[10px] flex flex-col gap-2.5">
		<Username {name} {username} />
		<Bio {bio} />
	</div>
</div>

<button
	transition:blur={{ duration: 250 }}
	onclick={triggerCard}
	class="fixed top-0 left-0 z-50 h-screen w-screen shadow-2xs backdrop-blur-[2px]"
	aria-label="Close profile overlay card"
>
</button>
