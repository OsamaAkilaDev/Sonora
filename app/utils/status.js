export function isSuccess(status) {
  if (status >= 200 && status < 300) return true;
  else return false;
}
