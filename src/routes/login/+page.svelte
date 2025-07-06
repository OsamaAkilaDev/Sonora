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
		class=" border-shade-700 z-1 flex w-100 flex-col gap-4 rounded-xl border-[2px] p-6 backdrop-blur-lg"
	>
		<h1 class="text-center font-bold text-white" style="font-size: 35px;">Welcome Back!</h1>
		<div class="flex flex-col gap-2.5">
			<p class="text-white">Login with your email</p>
			<InputField type="text" name="Email" placeholder="Enter your email" />
			<InputField type="password" name="Password" placeholder="Enter your Password" />
		</div>
		<SubmitButton />
	</form>

	<img class="fixed z-0 h-full w-full object-cover" src={bg} alt="" />
</div>
