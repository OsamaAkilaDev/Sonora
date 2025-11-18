import toast from "react-hot-toast";

let style = {
  background: "var(--color-shade-800)",
  color: "var(--color-shade-500)",
  borderRadius: "5px",
  borderWidth: "2px",
  borderStyle: "solid",
  borderColor: "var(--color-shade-700)",
  boxShadow: "rgba(0, 0, 0, 0.3) 0px 4px 6px",
};

export function iconToast(msg, icon) {
  toast.success(msg, {
    icon: icon,
    style: style,
  });
}

export function successToast(msg, position) {
  toast.success(msg, {
    style: style,
    position: position || null,
  });
}

export function errorToast(msg) {
  toast.error(msg, {
    style: style,
  });
}
