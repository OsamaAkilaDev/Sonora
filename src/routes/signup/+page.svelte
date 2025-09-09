<script>
	import InputField from '../../components/Inputs/InputField.svelte';
	import SubmitButton from '../../components/Inputs/SubmitButton.svelte';
	import bg from '$lib/images/bgd.jpg';
	import { validateTokenThenGoto } from '../../utils/auth';
	import { onMount } from 'svelte';
	import { backendURL } from '../../utils/constants';
	import { goto } from '$app/navigation';
	import { postRequest } from '../../utils/fetchers';

	onMount(() => validateTokenThenGoto('/app', null));

	let errors = $state({
		displayName: [],
		username: [],
		email: [],
		password: [],
		passwordConfirmed: []
	});

	async function onSubmit(e) {
		e.preventDefault();
		let formData = new FormData(e.target);

		let name = formData.get('Name');
		let username = formData.get('Username');
		let email = formData.get('Email');
		let password = formData.get('Password');
		let passwordConfirmed = formData.get('Confirm Password');

		let res = await postRequest('/auth/signup', {
			displayName: name,
			username: username,
			email: email,
			password: password,
			passwordConfirmed: passwordConfirmed
		});

		const data = await res.json();

		console.log(data);

		if (data.status === 406 || data.status === 409) {
			errors = {
				displayName: data.content.displayName || [],
				username: data.content.username || [],
				email: data.content.email || [],
				password: data.content.password || [],
				passwordConfirmed: data.content.passwordConfirmed || []
			};
		}
		//
		else if (data.status === 201) {
			goto('/login?signup=done');
		}
	}
</script>

<div class="bg-shade-900 bg flex h-screen w-full flex-col items-center justify-center gap-7">
	<form
		onsubmit={(e) => onSubmit(e)}
		class=" border-shade-700 z-1 flex w-100 flex-col rounded-xl border-[2px] p-6 backdrop-blur-lg"
	>
		<h1 class="mb-1 text-center font-bold text-white" style="font-size: 35px;">Sign up</h1>
		<div class="flex flex-col">
			<!-- <p class="mb-2 text-white">Sign up with your information</p> -->
			<div class="flex flex-col gap-2.5">
				<InputField
					type="text"
					name="Name"
					placeholder="Type the display name"
					error={errors?.displayName[0]}
				/>

				<InputField
					type="text"
					name="Username"
					placeholder="Type the username"
					error={errors?.username[0]}
				/>
				<InputField
					type="text"
					name="Email"
					placeholder="Type your email"
					error={errors?.email[0]}
				/>
				<InputField
					type="password"
					name="Password"
					placeholder="Type the password"
					error={errors?.password[0]}
				/>
				<InputField
					type="password"
					name="Confirm Password"
					placeholder="Confirm the password"
					error={errors?.passwordConfirmed[0]}
				/>
			</div>

			<p class="mt-5 mb-2 text-sm text-white">
				Already a user?
				<a href="/login" class="blue-link ml-1">Login</a>
			</p>
		</div>
		<SubmitButton value="Sign Up" />
	</form>

	<img class="fixed z-0 h-full w-full object-cover" src={bg} alt="" />
</div>
