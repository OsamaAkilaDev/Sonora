import toast from 'svelte-hot-french-toast';

let style = 'background: #333; color: white';

export function iconToast(msg, icon) {
	toast.success(msg, {
		icon: icon,
		style: style
	});
}

export function successToast(msg) {
	toast.success(msg, {
		style: style
	});
}

export function errorToast(msg) {
	toast.error(msg, {
		style: style
	});
}
