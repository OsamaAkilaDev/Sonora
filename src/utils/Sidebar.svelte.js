function Sidebar() {
	let isActive = $state(true);
	let type = $state('Friends');

	return {
		get isActive() {
			return isActive;
		},

		get type() {
			return type;
		},
		trigger(typeValue) {
			if (!(isActive && type != typeValue)) isActive = !isActive;
			type = typeValue;

			// console.log(isActive, type);
		}
	};
}

export const sidebar = new Sidebar();
