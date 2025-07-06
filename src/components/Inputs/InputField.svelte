<script>
	import { socialIcons } from '$lib/icons';

	let { type = 'text', placeholder = '', name } = $props();
	let icon = $state(socialIcons.user);

	let inputRef = $state(null);

	if (name == 'Email') icon = socialIcons.mail;
	else if (name == 'Password') icon = socialIcons.password;
	else if (name == 'Display Name') icon = socialIcons.user;
	else if (name == 'Username') icon = socialIcons.username;

	let isPasswordShown = $state(false);
	function triggerPasswordVisibility() {
		isPasswordShown = !isPasswordShown;
		if (isPasswordShown) inputRef.type = 'text';
		else inputRef.type = 'password';
	}
</script>

<div class="relative flex flex-col gap-1.5">
	<!-- <label class="text-white" for={name}>{name}</label> -->
	<div class="bg-shade-700 flex h-9 w-full flex-row items-center gap-2 rounded-md px-2">
		<div class="text-shade-600 h-5.5">
			{@html icon}
		</div>
		<input
			class="custom-input grow bg-transparent text-white outline-none"
			bind:this={inputRef}
			{type}
			{name}
			id={name}
			{placeholder}
		/>

		{#if type == 'password'}
			<button
				class="text-shade-600 h-5.5 cursor-pointer"
				onclick={triggerPasswordVisibility}
				aria-label={isPasswordShown ? 'Hide Password' : 'Show Password'}
			>
				{#if isPasswordShown}
					{@html socialIcons.hide}
				{:else}
					{@html socialIcons.show}
				{/if}
			</button>
		{/if}
	</div>

	<!-- <div class="bg-shade-650 absolute -right-1 h-8 w-10 translate-x-full rounded-md">
		<div class="triangle-left absolute left-0 -translate-x-full"></div>
	</div> -->
</div>
