import { goto } from '$app/navigation';
import { backendURL } from './constants';
import { isSuccess } from './status';

export async function validateTokenThenGoto(route, otherRoute) {
	// const token = await cookieStore.get('token');
	let res = await fetch(backendURL + '/auth/', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		credentials: 'include'
	});

	let data = await res.json();
	if (isSuccess(data.status)) {
		if (route) goto(route);
	}
	//
	else {
		if (otherRoute) goto(otherRoute);
	}

	return data;
}
