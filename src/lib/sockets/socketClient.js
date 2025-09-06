import { io } from 'socket.io-client';
import { socketURL } from '../../utils/constants';
import { activeChatData, chatContacts, selectedChat, updateData } from '$lib/globals/SocialData';
import { get } from 'svelte/store';

export function initSocket(userData) {
	const socket = io(socketURL);

	socket.emit('join', String(userData.content.user.id));
	socket.on('update-social-data', (message) => {
		// console.log(message);
		updateData(message);
	});

	socket.on('update-chat-list', (message) => {
		// console.log(message);
		chatContacts.set(message.chatList);
	});

	socket.on('new-message', (message) => {
		if (message.chatId === get(selectedChat)) {
			activeChatData.update((chat) => ({
				...chat,
				messages: [...chat.messages, message.message] // append safely
			}));
		}
	});
}
