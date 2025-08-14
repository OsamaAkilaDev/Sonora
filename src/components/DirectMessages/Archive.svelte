<script>
	let archivedChats = [];
</script>

{#if archivedChats.length >= 1}
	{@render Contact('Osama')}
	{@render Contact('Mahmoud')}
	{@render Contact('Khamis')}
	{@render Contact('Salem')}
	{@render Contact('Ibrahim')}
	{@render Contact('Akila')}
	{@render Contact('Ahmad')}
	{@render Contact('Ayman')}
	{@render Contact('Mohammad')}
	{@render Contact('Sami')}
	{@render Contact('Adbullah')}
	{@render Contact('Khaled')}
	{@render Contact('Waleed')}
	{@render Contact('Adel')}
	{@render Contact('Waleed')}
	{@render Contact('Loai')}
	{@render Contact('Saleh')}
	{@render Contact('Salah')}
	{@render Contact('Zaki')}
{:else}
	<div class="flex h-full w-full flex-col items-center justify-center">
		<p class="text-shade-600 text-center text-lg font-semibold">Empty shelves…</p>
		<p class="text-shade-600 text-center">No archived chats yet!</p>
	</div>
{/if}
