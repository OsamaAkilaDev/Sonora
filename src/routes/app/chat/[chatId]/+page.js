/** @type {import('./$types').PageLoad} */

import { activeChatData, selectedChat } from '$lib/globals/SocialData';
import { backendURL } from '../../../../utils/constants';

export const prerender = false;

export async function load({ fetch, params }) {
	selectedChat.set(params.chatId);

	let res = await fetch(backendURL + `/chat/${params.chatId}`, {
		method: 'GET',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'include'
	});

	let data = await res.json();

	// console.log(data);
	activeChatData.set(data.content);
	return data.content;
}
