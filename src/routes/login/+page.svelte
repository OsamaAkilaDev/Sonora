<script>
	import InputField from '../../components/Inputs/InputField.svelte';
	import SubmitButton from '../../components/Inputs/SubmitButton.svelte';
	import bg from '$lib/images/bgd.jpg';
	import { backendURL } from '../../utils/constants';
	import { isSuccess } from '../../utils/status';
	import { goto } from '$app/navigation';
	import { validateTokenThenGoto } from '../../utils/auth';
	import { onMount } from 'svelte';
	import toast, { Toaster } from 'svelte-hot-french-toast';

	onMount(() => {
		validateTokenThenGoto('/app', null);
		const urlParams = new URLSearchParams(window.location.search);

		if (urlParams.get('signup') === 'done')
			toast.success("You're all set! Log in to Sonora now.", {
				style: 'background: #333; color: white'
			});
	});

	let errors = $state({ email: '', password: '' });

	async function onSubmit(e) {
		e.preventDefault();
		let formData = new FormData(e.target);

		let email = formData.get('Email');
		let password = formData.get('Password');

		let res = await fetch(backendURL + '/auth/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: email, password: password })
		});

		const data = await res.json();

		if (isSuccess(data.status)) {
			await cookieStore.set('token', data.content.token);
			goto('/app');
		}
		//
		else if (data.status === 400) {
			errors.email = 'Invalid email';
			errors.password = '';
		}
		//
		else if (data.status === 401) {
			errors.email = '';
			errors.password = 'Incorrect Password';
		}
	}
</script>

<div class="bg-shade-900 bg flex h-screen w-full flex-col items-center justify-center gap-7">
	<form
		onsubmit={(e) => onSubmit(e)}
		class=" border-shade-700 z-1 flex w-100 flex-col rounded-xl border-[2px] p-6 backdrop-blur-lg"
	>
		<h1 class="mb-1 text-center text-[32px] font-bold text-white">Login</h1>
		<div class="flex flex-col">
			<!-- <p class="mb-2 text-white">Login with your email</p> -->
			<div class="flex flex-col gap-2.5">
				<InputField type="text" name="Email" placeholder="Type your email" error={errors.email} />
				<InputField
					type="password"
					name="Password"
					placeholder="Type your password"
					error={errors.password}
				/>
			</div>

			<p class="mt-5 mb-2 text-sm text-white">
				New here?
				<a href="/signup" class="blue-link ml-1">Sign up</a>
			</p>
		</div>
		<SubmitButton value="Log In" />
	</form>

	<img class="fixed z-0 h-full w-full object-cover" src={bg} alt="" />
	<Toaster />
</div>
