<script>
	import pfp1 from '$lib/images/pfp.png';
	import bnr1 from '$lib/images/banner.jpeg';
	import { utilitiesIcons } from '$lib/icons';

	let { bnr = bnr1, pfp = pfp1 } = $props();
</script>

<div class="relative mb-2 h-[160px] w-full rounded-md bg-teal-700">
	<div class="absolute flex w-full justify-end gap-1.5 p-1.5">
		{@render actionButton(utilitiesIcons.options)}
	</div>

	<img class="h-full w-full rounded-[inherit] object-cover object-bottom" src={bnr} alt="" />
	<div class="bg-shade-800 absolute -bottom-[50px] left-6 h-25 w-25 rounded-full">
		<img class="h-full w-full rounded-full" src={pfp} alt="Profile" />
	</div>
</div>

{#snippet actionButton(icon, name)}
	<button
		class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[#00000080] p-[5px] text-white backdrop-blur-[1px]"
	>
		{@html icon}
	</button>
{/snippet}
