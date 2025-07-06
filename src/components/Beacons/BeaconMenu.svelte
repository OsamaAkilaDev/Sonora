<script>
	import { beacons } from '$lib/icons';
</script>

<div class="flex h-full flex-row items-center justify-center gap-[9px]">
	{#each beacons as beacon}
		<div class="h-[35px] w-[35px] cursor-pointer">
			<img class="h-full rounded-md" src={beacon.icon} alt={beacon.name + ' Beacon'} />
		</div>
	{/each}
</div>
