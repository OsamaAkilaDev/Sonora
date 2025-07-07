<script>
	import InputField from '../../components/Inputs/InputField.svelte';
	import SubmitButton from '../../components/Inputs/SubmitButton.svelte';
	import bg from '$lib/images/bgd.jpg';

	function onSubmit(e) {
		e.preventDefault();
		let formData = new FormData(e.target);

		let email = formData.get('Email');
		let password = formData.get('Password');
	}
</script>

<div class="bg-shade-900 bg flex h-screen w-full flex-col items-center justify-center gap-7">
	<form
		onsubmit={(e) => onSubmit(e)}
		class=" border-shade-700 z-1 flex w-100 flex-col rounded-xl border-[2px] p-6 backdrop-blur-lg"
	>
		<h1 class="mb-4 text-center font-bold text-white" style="font-size: 35px;">Welcome!</h1>
		<div class="flex flex-col">
			<p class="mb-2 text-white">Sign up with your information</p>
			<div class="flex flex-col gap-2.5">
				<InputField type="text" name="Name" placeholder="Display name" />
				<InputField type="text" name="Username" placeholder="Username" />
				<InputField type="text" name="Email" placeholder="Email" />
				<InputField type="password" name="Password" placeholder="Password" />
				<InputField type="password" name="Password" placeholder="Confirm Password" />
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
