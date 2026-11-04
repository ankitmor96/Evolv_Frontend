import { useState, useEffect } from 'react';
import { adminService } from '../../services/adminService.js';
import { navigate } from '../../utils/navigate.js';

const styles = `
  .adm-login-root {
    min-height: 100vh;
    background: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    padding: 1rem;
    position: relative;
    overflow: hidden;
  }
  .adm-login-root::before {
    content: '';
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse 60% 50% at 50% 0%, rgba(170, 69, 245, 0.12) 0%, transparent 70%);
    pointer-events: none;
  }
  .adm-login-root::after {
    content: '';
    position: absolute;
    bottom: -10%;
    left: 50%;
    transform: translateX(-50%);
    width: 600px;
    height: 300px;
    background: radial-gradient(ellipse, rgba(170, 69, 245, 0.06) 0%, transparent 70%);
    pointer-events: none;
  }
  .adm-login-card {
    position: relative;
    z-index: 1;
    background: #0D0A15;
    border: 1px solid rgba(170, 69, 245, 0.2);
    border-radius: 20px;
    padding: 2.5rem 2rem;
    width: 100%;
    max-width: 420px;
    box-shadow: 0 0 60px rgba(170, 69, 245, 0.08), 0 24px 48px rgba(0,0,0,0.4);
  }
  .adm-login-top {
    text-align: center;
    margin-bottom: 2rem;
  }
  .adm-login-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, rgba(170,69,245,0.2), rgba(170,69,245,0.05));
    border: 1px solid rgba(170,69,245,0.3);
    border-radius: 16px;
    margin-bottom: 1.2rem;
  }
  .adm-login-brand {
    font-size: 1.6rem;
    font-weight: 800;
    letter-spacing: -0.5px;
    background: linear-gradient(135deg, #C084FC 0%, #AA45F5 60%, #8B2FD8 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin: 0 0 0.2rem;
    line-height: 1;
  }
  .adm-login-subtitle {
    font-size: 0.8rem;
    font-weight: 500;
    letter-spacing: 0.15em;
    text-transform: uppercase;
    color: rgba(240, 235, 248, 0.45);
    margin: 0 0 0.8rem;
  }
  .adm-login-heading {
    font-size: 1.1rem;
    font-weight: 600;
    color: rgba(240, 235, 248, 0.9);
    margin: 0;
  }
  .adm-login-divider {
    width: 40px;
    height: 2px;
    background: linear-gradient(90deg, transparent, rgba(170,69,245,0.5), transparent);
    margin: 0.8rem auto 0;
    border: none;
  }
  .adm-login-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .adm-login-field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .adm-login-label {
    font-size: 0.78rem;
    font-weight: 500;
    color: rgba(240, 235, 248, 0.55);
    text-transform: uppercase;
    letter-spacing: 0.08em;
  }
  .adm-login-input-wrap {
    position: relative;
  }
  .adm-login-input {
    width: 100%;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(170,69,245,0.15);
    border-radius: 10px;
    padding: 0.75rem 1rem;
    color: #F0EBF8;
    font-size: 0.9rem;
    font-family: inherit;
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
    box-sizing: border-box;
  }
  .adm-login-input:focus {
    border-color: rgba(170,69,245,0.5);
    background: rgba(170,69,245,0.04);
    box-shadow: 0 0 0 3px rgba(170,69,245,0.08);
  }
  .adm-login-input::placeholder {
    color: rgba(240,235,248,0.2);
  }
  .adm-login-input.adm-login-has-toggle {
    padding-right: 3rem;
  }
  .adm-login-toggle-pw {
    position: absolute;
    right: 0.75rem;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    color: rgba(240,235,248,0.4);
    padding: 0.2rem;
    display: flex;
    align-items: center;
    transition: color 0.2s;
  }
  .adm-login-toggle-pw:hover {
    color: rgba(170,69,245,0.8);
  }
  .adm-login-remember {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    user-select: none;
  }
  .adm-login-remember input[type="checkbox"] {
    appearance: none;
    -webkit-appearance: none;
    width: 16px;
    height: 16px;
    border: 1px solid rgba(170,69,245,0.3);
    border-radius: 4px;
    background: rgba(255,255,255,0.04);
    cursor: pointer;
    position: relative;
    flex-shrink: 0;
    transition: border-color 0.2s, background 0.2s;
  }
  .adm-login-remember input[type="checkbox"]:checked {
    background: #AA45F5;
    border-color: #AA45F5;
  }
  .adm-login-remember input[type="checkbox"]:checked::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 5px;
    width: 4px;
    height: 7px;
    border: 2px solid #fff;
    border-top: none;
    border-left: none;
    transform: rotate(45deg);
  }
  .adm-login-remember-text {
    font-size: 0.83rem;
    color: rgba(240,235,248,0.5);
  }
  .adm-login-error {
    background: rgba(239,68,68,0.1);
    border: 1px solid rgba(239,68,68,0.25);
    border-radius: 10px;
    padding: 0.7rem 1rem;
    font-size: 0.83rem;
    color: #FCA5A5;
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    line-height: 1.4;
  }
  .adm-login-btn {
    width: 100%;
    padding: 0.85rem;
    background: linear-gradient(135deg, #AA45F5 0%, #8B2FD8 100%);
    border: none;
    border-radius: 10px;
    color: #fff;
    font-size: 0.9rem;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: opacity 0.2s, transform 0.1s, box-shadow 0.2s;
    box-shadow: 0 4px 16px rgba(170,69,245,0.3);
    position: relative;
    overflow: hidden;
    margin-top: 0.25rem;
  }
  .adm-login-btn:not(:disabled):hover {
    opacity: 0.92;
    box-shadow: 0 4px 24px rgba(170,69,245,0.45);
  }
  .adm-login-btn:not(:disabled):active {
    transform: scale(0.98);
  }
  .adm-login-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  .adm-login-btn-inner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  .adm-login-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255,255,255,0.3);
    border-top-color: #fff;
    border-radius: 50%;
    animation: adm-spin 0.7s linear infinite;
  }
  @keyframes adm-spin {
    to { transform: rotate(360deg); }
  }
  .adm-login-footer {
    margin-top: 1.5rem;
    text-align: center;
    font-size: 0.75rem;
    color: rgba(240,235,248,0.25);
  }
  @media (max-width: 480px) {
    .adm-login-card {
      padding: 2rem 1.25rem;
    }
  }
`;

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

useEffect(() => {
  if (adminService.isLoggedIn()) navigate('/admin/dashboard', { replace: true });
}, []);

  const validate = () => {
    if (!email.trim()) return 'Email is required.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return 'Enter a valid email address.';
    if (!password) return 'Password is required.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);

    try {
      const isValidDemoAdmin =
        email.trim().toLowerCase() === 'admin@evolvs.com' &&
        password === 'Admin@123';

      if (!isValidDemoAdmin) {
        throw new Error('Invalid demo admin credentials.');
      }

      // Temporary demo session; does not touch user authentication
      sessionStorage.setItem(
        'evolvs_admin_demo_session',
        JSON.stringify({
          email: 'admin@evolvs.com',
          role: 'admin',
          isDemo: true,
          loginAt: Date.now()
        })
      );

      navigate('/admin/dashboard', { replace: true });

    } catch (ex) {
      setError(ex.message || 'Login failed.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <>
      <style>{styles}</style>
      <div className="adm-login-root">
        <div className="adm-login-card">
          <div className="adm-login-top">
            <div className="adm-login-icon">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#AA45F5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h1 className="adm-login-brand">EVOLVS</h1>
            <p className="adm-login-subtitle">Admin Panel</p>
            <p className="adm-login-heading">Sign in to your account</p>
            <hr className="adm-login-divider" />
          </div>

          <form className="adm-login-form" onSubmit={handleSubmit} noValidate>
            <div className="adm-login-field">
              <label className="adm-login-label" htmlFor="adm-email">Email Address</label>
              <div className="adm-login-input-wrap">
                <input
                  id="adm-email"
                  className="adm-login-input"
                  type="email"
                  placeholder="admin@evolvs.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                  disabled={loading}
                />
              </div>
            </div>

            <div className="adm-login-field">
              <label className="adm-login-label" htmlFor="adm-password">Password</label>
              <div className="adm-login-input-wrap">
                <input
                  id="adm-password"
                  className="adm-login-input adm-login-has-toggle"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="adm-login-toggle-pw"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPw ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <label className="adm-login-remember">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                disabled={loading}
              />
              <span className="adm-login-remember-text">Keep me signed in</span>
            </label>

            {error && (
              <div className="adm-login-error" role="alert">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: '1px' }}>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <button className="adm-login-btn" type="submit" disabled={loading}>
              <span className="adm-login-btn-inner">
                {loading ? (
                  <>
                    <span className="adm-login-spinner" />
                    Authenticating…
                  </>
                ) : (
                  <>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    Sign In to Admin Panel
                  </>
                )}
              </span>
            </button>
          </form>

          <p className="adm-login-footer">
            EVOLVS Admin &bull; Authorized Personnel Only
          </p>
        </div>
      </div>
    </>
  );
}

