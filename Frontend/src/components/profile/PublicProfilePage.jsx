import React, { useEffect, useState } from 'react';
import { navigate } from '../../utils/navigate.js';
import './ProfilePage.css';

const API_URL = import.meta.env.VITE_API_URL || '';

export default function PublicProfilePage({ username }) {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    fetch(`${API_URL}/api/profile/public/${encodeURIComponent(username)}`)
      .then((r) => {
        if (!r.ok) throw new Error('Profile not found');
        return r.json();
      })
      .then((data) => { if (!cancelled) setProfile(data?.data ?? data); })
      .catch((e) => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [username]);

  useEffect(() => {
    if (profile) document.title = `${profile.fullName} (@${profile.username}) | EVOLV`;
  }, [profile]);

  if (loading) return <p style={{ padding: 24 }}>Loading…</p>;
  if (error) return <p style={{ padding: 24 }}>{error}</p>;

  const initials = (profile.fullName || 'U')
    .split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="pp-content" style={{ maxWidth: 720, margin: '0 auto', padding: 16 }}>
      <div className="pp-hero-card">
        <div className="pp-hero-body">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt={profile.fullName} className="pp-hero-avatar" />
          ) : (
            <div className="pp-hero-avatar-fallback">{initials}</div>
          )}

          <h1 className="pp-hero-name">{profile.fullName}</h1>
          <p className="pp-hero-username">@{profile.username}</p>
          {profile.bio && <p className="pp-hero-bio">{profile.bio}</p>}

          <div style={{ marginTop: 16 }}>
            <button className="pp-edit-btn" onClick={() => navigate('/signup')}>
              Join EVOLV to connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}