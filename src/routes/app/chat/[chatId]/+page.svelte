<script>
	import { selectedChat } from '$lib/globals/SocialData';
	import ChatBox from '../../../../components/Bubbles/ChatBox.svelte';
	let { data } = $props();
</script>

<ChatBox />
