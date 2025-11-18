export function dateOf(isoString) {
	const datetime = new Date(isoString);
	const day = String(datetime.getDate()).padStart(2, '0'); // local date
	const month = String(datetime.getMonth() + 1).padStart(2, '0'); // local month
	const year = datetime.getFullYear(); // local year

	return `${day}/${month}/${year}`;
}

export function timeOf(isoString) {
	const datetime = new Date(isoString);

	let hours = datetime.getHours(); // 0–23
	const minutes = String(datetime.getMinutes()).padStart(2, '0');
	const ampm = hours >= 12 ? 'PM' : 'AM';

	hours = hours % 12;
	hours = hours ? hours : 12; // 0 becomes 12

	return `${hours}:${minutes} ${ampm}`;
}
