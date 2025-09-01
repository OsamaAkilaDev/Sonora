import { io } from 'socket.io-client';
import { socketURL } from '../../utils/constants';
import { updateData } from '$lib/globals/SocialData';

export function initSocket(userData) {
	const socket = io(socketURL);

	socket.emit('join', String(userData.content.user.id));
	socket.on('update-social-data', (message) => {
		console.log(message);
		updateData(message);
	});
}
