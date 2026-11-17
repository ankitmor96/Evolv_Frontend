const SITE_URL =
  import.meta.env.VITE_PUBLIC_SITE_URL || window.location.origin;

function getMedium() {
  const ua = navigator.userAgent || '';
  if (/android/i.test(ua)) return 'member_android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'member_ios';
  return 'member_desktop';
}

export function buildProfileShareUrl(username) {
  const params = new URLSearchParams({
    utm_source: 'share_via',
    utm_content: 'profile',
    utm_medium: getMedium(),
  });
  return `${SITE_URL}/in/${encodeURIComponent(username)}?${params.toString()}`;
}