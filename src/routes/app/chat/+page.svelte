<script>
	import { socialIcons } from '$lib/icons';
	import { sidebar } from '../../../utils/Sidebar.svelte';
</script>

<main
	class="bubble flex flex-col items-center justify-center overflow-hidden"
	class:col-span-1={sidebar.isActive}
	class:col-span-2={!sidebar.isActive}
>
	<div class="text-shade-640 drop-shadow-3xl relative max-w-[210px] max-md:max-w-[150px]">
		{@html socialIcons.chat}
	</div>

	<div class="flex w-full flex-col items-center justify-center gap-1">
		<p class="text-shade-600 text-center text-[26px] font-medium max-md:text-[18px]">
			Your chat awaits
		</p>
		<p class="text-shade-600 max-w-[30%] text-center text-xl max-md:text-[18px]">
			Select a friend to begin the conversation
		</p>
	</div>
</main>
