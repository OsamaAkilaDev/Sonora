<script>
	import pfp from '$lib/images/pfp.png';
	import pfp2 from '$lib/images/pfp2.png';
	import { navigationBarIcons, socialIcons, utilitiesIcons } from '$lib/icons';
	import ChatHeader from '../Chatting/ChatHeader.svelte';
	import ChatMessage from '../Chatting/ChatMessage.svelte';
	import MessageComposer from '../Chatting/MessageComposer.svelte';
	import ProfileIconButton from '../Profile/ProfileIconButton.svelte';
	import { sidebar } from '../../utils/Sidebar.svelte';
</script>

<main
	class={`bubble max-h-full overflow-hidden`}
	class:col-span-1={sidebar.isActive}
	class:col-span-2={!sidebar.isActive}
>
	<ChatHeader />
	<div class="h-[calc(100%-103px)] py-2.5 pr-2 pl-1.5">
		<div class=" flex max-h-full flex-col gap-4 overflow-x-hidden overflow-y-auto px-3">
			<ChatMessage
				username="Ahmad"
				msg={`Salam bro! Just got back from uni. Today was wild — the professor gave us a pop quiz and didn’t even warn us 😤
				I swear half the class looked like they were about to cry lol`}
			/>

			<ChatMessage
				img={pfp2}
				username="Omar"
				msg={`Walaykum Salam! Man, I feel you 😅 That’s the worst. Professors here love those surprise quizzes like it's a game.
				How’d you do though?`}
			/>

			<ChatMessage
				username="Ahmad"
				msg={`Alhamdulillah, not too bad. I revised a bit last night so I managed to answer most of it. But honestly, my brain was running on 2% battery after that morning traffic and zero breakfast.`}
			/>

			<ChatMessage
				img={pfp2}
				username="Omar"
				msg={`Broooo same. I skipped breakfast too, and regretted it by 10am.
				I ended up eating chips from the vending machine like some lost soul in the hallway 😂`}
			/>

			<ChatMessage
				username="Ahmad"
				msg={`Wallah, uni life is humbling. One day you’re discussing quantum mechanics, the next you’re bargaining with a vending machine for expired snacks 💀
				How was your day anyway?`}
			/>

			<ChatMessage
				img={pfp2}
				username="Omar"
				msg={`It was alright. I had that internship interview — remember I told you?
				It went okay I think, the guy asked a lot of technical stuff but also some personality questions, like how I work in teams and deal with pressure.`}
			/>

			<ChatMessage
				username="Ahmad"
				msg={`Yooo that’s great! Insha’Allah you get it. You deserve it man.
				They’d be lucky to have someone as hardworking and chill as you 🙌🏼`}
			/>

			<ChatMessage
				img={pfp2}
				username="Omar"
				msg={`Ameen ya Rab.
				Thanks bro, seriously. You always hype me up when I need it lol.
				Wanna hang out later? Maybe grab a shawarma or just chill in the park?`}
			/>

			<ChatMessage
				username="Ahmad"
				msg={`Sounds perfect. Let me just help my mom with a few things at home, and I’ll text you when I’m free. Maybe around 7?`}
			/>

			<ChatMessage
				img={pfp2}
				username="Omar"
				msg={`Aight. I’ll be free after Maghrib anyway. Just message me when you're good.`}
			/>

			<ChatMessage username="Ahmad" msg={`Done deal. See you soon insha’Allah ✌🏼`} />
		</div>
	</div>
	<MessageComposer />
</main>
