export function dateOf(isoString) {
	const datetime = new Date(isoString);
	const day = String(datetime.getUTCDate()).padStart(2, '0');
	const month = String(datetime.getUTCMonth() + 1).padStart(2, '0');
	const year = datetime.getUTCFullYear();

	return `${day}/${month}/${year}`;
}

export function timeOf(isoString) {
	const datetime = new Date(isoString);
	const hours = String(datetime.getUTCHours()).padStart(2, '0');
	const minutes = String(datetime.getUTCMinutes()).padStart(2, '0');
	return `${hours}:${minutes}`;
}
