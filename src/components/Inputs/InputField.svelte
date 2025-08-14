<script>
	import { socialIcons } from '$lib/icons';

	let { type = 'text', placeholder = '', name, disabled = false, error = '' } = $props();
	let icon = $state(socialIcons.user);

	let inputRef = $state(null);

	if (name == 'Email') icon = socialIcons.mail;
	else if (name == 'Password' || name == 'Confirm Password') icon = socialIcons.password;
	else if (name == 'Display Name') icon = socialIcons.user;
	else if (name == 'Username') icon = socialIcons.username;

	let isPasswordShown = $state(false);
	function triggerPasswordVisibility() {
		isPasswordShown = !isPasswordShown;
		if (isPasswordShown) inputRef.type = 'text';
		else inputRef.type = 'password';
	}
</script>

<div class="relative flex flex-col gap-1">
	<div class="flex w-full items-end justify-between">
		<label class="text-white" for={name}>{name}</label>
		<p class="text-rednor-700 text-sm">{error}</p>
	</div>
	<div class="bg-shade-700 flex h-9 w-full flex-row items-center gap-2 rounded-md px-2">
		<div class="text-shade-600 h-[22px] w-[22px]">
			{@html icon}
		</div>

		<input
			class="custom-input grow bg-transparent text-white outline-none"
			bind:this={inputRef}
			{type}
			{name}
			{disabled}
			id={name}
			{placeholder}
			required
		/>

		{#if type == 'password'}
			<button
				type="button"
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
