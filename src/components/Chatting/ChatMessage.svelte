<script>
	import pfp from '$lib/images/pfp.png';

	let {
		img = pfp,
		username = 'Osama Akila',
		msg = 'Hello everybody',
		date = '19/7/2023',
		time = '7:35 PM'
	} = $props();
</script>

<div class="flex items-start gap-4.5 text-white">
	<img class="h-10 w-10 rounded-full" src={img} alt={username} />
	<div class="flex flex-col items-start">
		<div class="flex items-end gap-3">
			<p class="selectable">{username}</p>
			<p class="text-shade-600 selectable text-[13px]">{date} {time}</p>
		</div>
		<p class="selectable font-[300]" style="white-space: pre-line">{msg}</p>
	</div>
</div>
