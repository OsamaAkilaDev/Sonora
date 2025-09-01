import { writable } from 'svelte/store';

export const friends = writable([]);
export const receivedRequests = writable([]);
export const sentRequests = writable([]);

export function updateData(data) {
	friends.set(data.friends);
	receivedRequests.set(data.receivedRequests);
	sentRequests.set(data.sentRequests);
}
