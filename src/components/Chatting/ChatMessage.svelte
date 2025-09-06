<script>
	import pfp from '$lib/images/default_pfp.png';
	import { dateOf, timeOf } from '../../utils/time';

	let {
		img,
		username = 'Osama Akila',
		msg = 'Hello everybody',
		isoString = '2025-09-06T06:37:31.638Z'
	} = $props();
</script>

<div class="flex items-start gap-4 text-white">
	<img class="h-10 w-10 rounded-full" src={img ? img : pfp} alt={username} />
	<div class="flex flex-col items-start">
		<div class="flex items-baseline gap-3">
			<p class="selectable text-[15px]">{username}</p>
			<p class="text-shade-600 selectable text-[11px]">{dateOf(isoString)} {timeOf(isoString)}</p>
		</div>
		<p class="selectable font-[300]" style="white-space: pre-line">{msg}</p>
	</div>
</div>
