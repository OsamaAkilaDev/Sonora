<script>
	import { socialIcons } from '$lib/icons';

	let { name = 'Ahmad Mohammad', username = 'AhmadMo1995' } = $props();
</script>

<div class=" flex flex-col px-4">
	<div class="flex h-[33px] items-center gap-2">
		<p class="selectable text-[22px] font-[450] text-white">{name}</p>
		<div class="h-[22px] text-yellow-500">
			{@html socialIcons.verified}
		</div>
	</div>
	<p class="selectable text-[17px] font-[250] text-white">@{username}</p>
</div>
