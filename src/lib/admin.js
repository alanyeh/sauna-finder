const ADMIN_EMAILS = [
  'alnyeh@gmail.com',
];

export function isAdmin(user) {
  if (!user?.email) return false;
  return ADMIN_EMAILS.includes(user.email.toLowerCase());
}
