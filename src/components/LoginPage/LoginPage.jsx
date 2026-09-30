
import { useState, useEffect } from "react";
import { authService } from "../../services/authService.js";
import evolvLogo from "../../assets/evolv-removebg-preview.png";
import "./LoginPage.css";

// SVG Icons matching Reference Image exactly
const WhoIAmIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"></circle>
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"></path>
  </svg>
);

// EVOLV Logo Image Component
const EvolvLogo = () => (
  <img
    src={evolvLogo}
    alt="EVOLV – A Human Growth Network"
    className="evolv-logo-image"
  />
);

const GoogleIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.28v3.13C3.25 21.3 7.31 24 12 24z"/>
    <path fill="#FBBC05" d="M5.28 14.27A7.2 7.2 0 0 1 4.9 12c0-.79.13-1.57.38-2.27V6.6H1.28A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.28 5.4l4-3.13z"/>
    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.7 1.28 6.6l4 3.13c.95-2.83 3.6-4.98 6.72-4.98z"/>
  </svg>
);

const PhoneHandsetIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111111" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
  </svg>
);

const MailEnvelopeIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="3"></rect>
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>
  </svg>
);

const LockOutlineIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
  </svg>
);

const EyeToggleIcon = ({ visible }) => (
  visible ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
      <circle cx="12" cy="12" r="3"></circle>
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#666666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
      <line x1="1" y1="1" x2="23" y2="23"></line>
    </svg>
  )
);

const ArrowRightIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"></line>
    <polyline points="12 5 19 12 12 19"></polyline>
  </svg>
);

const UserIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
    <circle cx="12" cy="7" r="4"></circle>
  </svg>
);

// Left Card Illustration Component matching Reference Image Artwork
const ArtSceneIllustration = () => (
  <div className="art-illustration-wrapper">
    <svg viewBox="0 0 300 210" className="art-svg-scene">
      {/* Background stars */}
      <path d="M25 40 L28 46 L34 49 L28 52 L25 58 L22 52 L16 49 L22 46 Z" fill="#ffd700" opacity="0.85" />
      <path d="M270 20 L272 24 L276 26 L272 28 L270 32 L268 28 L264 26 L268 24 Z" fill="#ffffff" opacity="0.9" />

      {/* Potted Plant */}
      <g transform="translate(10, 125)">
        <path d="M12 55 L28 55 L32 25 L8 25 Z" fill="#ffffff" stroke="#222" strokeWidth="2" />
        <line x1="6" y1="25" x2="34" y2="25" stroke="#222" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M20 25 C10 10 2 -5 18 -15 C22 -15 24 5 20 25 Z" fill="#2d6a4f" stroke="#222" strokeWidth="1.8" />
        <path d="M20 25 C30 10 38 -5 22 -15 C18 -15 16 5 20 25 Z" fill="#40916c" stroke="#222" strokeWidth="1.8" />
        <path d="M20 25 C20 5 15 -22 20 -25 C25 -22 20 5 20 25 Z" fill="#52b788" stroke="#222" strokeWidth="1.8" />
      </g>

      {/* Person on Beanbag Chair */}
      <g transform="translate(60, 80)">
        <path d="M15 90 C-10 70 5 25 45 25 C85 25 105 70 80 90 C65 100 30 100 15 90 Z" fill="#7012ce" stroke="#1d033a" strokeWidth="2.5" />
        <path d="M35 70 L48 85 L65 85" stroke="#1d033a" strokeWidth="7" strokeLinecap="round" />
        <path d="M40 70 L55 90 L75 90" stroke="#7012ce" strokeWidth="6" strokeLinecap="round" />
        <rect x="62" y="80" width="22" height="12" rx="6" fill="#ffffff" stroke="#222" strokeWidth="2" />
        <rect x="72" y="85" width="22" height="12" rx="6" fill="#ffffff" stroke="#222" strokeWidth="2" />
        <path d="M64 86 L74 86" stroke="#c084fc" strokeWidth="3" />
        <path d="M74 91 L84 91" stroke="#c084fc" strokeWidth="3" />

        <path d="M25 40 C20 25 35 15 50 15 C65 15 75 25 70 40 C65 60 50 68 35 65 Z" fill="#a855f7" stroke="#222" strokeWidth="2" />
        <circle cx="48" cy="12" r="14" fill="#ffdbac" stroke="#222" strokeWidth="2" />
        <path d="M34 10 C34 0 45 -5 58 0 C64 5 62 16 62 16 C58 10 50 8 44 12 Z" fill="#111827" />

        <rect x="42" y="32" width="12" height="20" rx="3" fill="#111827" stroke="#222" strokeWidth="1.5" transform="rotate(-15 48 42)" />
        <rect x="44" y="34" width="8" height="16" rx="2" fill="#c084fc" transform="rotate(-15 48 42)" />
        <circle cx="36" cy="40" r="4" fill="#ffdbac" stroke="#222" strokeWidth="1.5" />
        <circle cx="56" cy="38" r="4" fill="#ffdbac" stroke="#222" strokeWidth="1.5" />
      </g>

      {/* Cloud Character on Laptop */}
      <g transform="translate(170, 90)">
        <path d="M20 50 C5 50 0 35 15 25 C10 10 30 0 45 10 C55 -2 75 -2 85 10 C100 0 115 15 105 30 C120 40 110 55 95 55 C95 62 30 62 20 50 Z" 
              fill="#ffffff" stroke="#222222" strokeWidth="2.5" strokeLinejoin="round" />

        <rect x="35" y="20" width="22" height="14" rx="3" fill="#111827" stroke="#222" strokeWidth="1.5" />
        <rect x="62" y="20" width="22" height="14" rx="3" fill="#111827" stroke="#222" strokeWidth="1.5" />
        <line x1="57" y1="25" x2="62" y2="25" stroke="#111827" strokeWidth="3" />
        <line x1="38" y1="23" x2="48" y2="23" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="65" y1="23" x2="75" y2="23" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />

        <path d="M50 42 Q60 48 70 42" fill="none" stroke="#222222" strokeWidth="2.5" strokeLinecap="round" />

        <g transform="translate(65, 30)">
          <rect x="0" y="0" width="34" height="24" rx="2" fill="#1f2937" stroke="#222" strokeWidth="2" />
          <rect x="3" y="3" width="28" height="18" fill="#374151" />
          <path d="M8 12 L14 12 M8 16 L20 16" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" />
          <path d="M-8 24 L42 24 L38 30 L-4 30 Z" fill="#9ca3af" stroke="#222" strokeWidth="2" />
        </g>
      </g>
    </svg>
  </div>
);

const AtSignIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555555" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4"></circle>
    <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"></path>
  </svg>
);

const LoginPage = () => {
  const isAuthPath = () =>
    window.location.pathname === "/login" || window.location.pathname === "/signup";

  // Navigation / Modal Tabs & Method States
  const [activeTab, setActiveTab] = useState(() =>
    window.location.pathname === "/signup" ? "signup" : "login"
  );
  const [isAuthRoute, setIsAuthRoute] = useState(isAuthPath);
  const [authMethod, setAuthMethod] = useState("email");

  // Input fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [fieldErrors, setFieldErrors] = useState({});

  // Phone + OTP state
  const [countryCode, setCountryCode] = useState("+1");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Status & Auth User State
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Route syncing (/login and /signup) – no router dependency needed
  useEffect(() => {
    const onPopState = () => {
      setActiveTab(window.location.pathname === "/signup" ? "signup" : "login");
      setIsAuthRoute(isAuthPath());
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = (path) => {
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
    setActiveTab(path === "/signup" ? "signup" : "login");
    setIsAuthRoute(true);
  };

  // Inline validation helpers
  const emailError = (value) => {
    if (!value.trim()) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim())) {
      return "Enter a valid email address.";
    }
    return "";
  };

  const passwordError = (value) => {
    if (!value) return "Password is required.";
    if (value.length < 8) return "Password must be at least 8 characters.";
    return "";
  };

  const validateLogin = () => {
    const errors = {
      email: emailError(email),
      password: passwordError(password),
    };
    setFieldErrors(errors);
    return Object.values(errors).every((msg) => !msg);
  };

  const validateSignup = () => {
    const errors = {
      fullName: !fullName.trim()
        ? "Full name is required."
        : fullName.trim().length < 2
          ? "Full name must be at least 2 characters."
          : "",
      username: !username.trim()
        ? "Username is required."
        : username.trim().length < 3
          ? "Username must be at least 3 characters."
          : !/^[a-zA-Z0-9_]+$/.test(username.trim())
            ? "Use only letters, numbers and underscore."
            : "",
      email: emailError(email),
      password: passwordError(password),
      confirmPassword: !confirmPassword
        ? "Confirm your password."
        : confirmPassword !== password
          ? "Passwords do not match."
          : "",
    };
    setFieldErrors(errors);
    return Object.values(errors).every((msg) => !msg);
  };

  const getPasswordStrength = (value) => {
    if (!value) return { score: 0, label: "" };
    let score = 0;
    if (value.length >= 8) score += 1;
    if (/[A-Z]/.test(value) && /[a-z]/.test(value)) score += 1;
    if (/\d/.test(value) || /[^a-zA-Z0-9]/.test(value)) score += 1;
    if (score <= 1) return { score: 1, label: "Weak" };
    if (score === 2) return { score: 2, label: "Medium" };
    return { score: 3, label: "Strong" };
  };

  const passwordStrength = getPasswordStrength(password);

  // Clear messages on state changes
  const switchMethod = (method) => {
    setAuthMethod(method);
    setErrorMessage("");
    setSuccessMessage("");
    setOtpSent(false);
    setOtpCode("");
  };

  const switchTab = (tab) => {
    // Main page keeps its original in-place tab switch; /login + /signup use routes
    if (isAuthRoute) {
      navigate(tab === "signup" ? "/signup" : "/login");
    } else {
      setActiveTab(tab);
    }
    setAuthMethod("email");
    setErrorMessage("");
    setSuccessMessage("");
    setFieldErrors({});
  };

  // Form Submit Handlers
  const handleEmailPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Inline validation only runs on the /login and /signup pages
    if (isAuthRoute) {
      const isValid = activeTab === "signup" ? validateSignup() : validateLogin();
      if (!isValid) return;
    }

    setIsLoading(true);

    try {
      if (activeTab === "signup") {
        const result = await authService.signup(fullName, email, password);
        setSuccessMessage("Account created successfully!");
        setCurrentUser(result.user);
      } else {
        const result = await authService.loginWithEmail(email, password, rememberMe);
        setSuccessMessage(`Welcome back, ${result.user.name || result.user.email}!`);
        setCurrentUser(result.user);
      }
    } catch (err) {
      setErrorMessage(err.message || "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPhoneOTP = async (e) => {
    e?.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const res = await authService.sendPhoneOTP(countryCode, phoneNumber);
      setOtpSent(true);
      setCountdown(30);
      setSuccessMessage(res.message || "OTP code sent to your phone! Use 123456 to test.");
    } catch (err) {
      setErrorMessage(err.message || "Failed to send OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPhoneOTP = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const result = await authService.verifyPhoneOTP(countryCode, phoneNumber, otpCode);
      setSuccessMessage(`Logged in successfully with phone!`);
      setCurrentUser(result.user);
    } catch (err) {
      setErrorMessage(err.message || "Invalid OTP code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmailOTP = async (e) => {
    e?.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const res = await authService.sendEmailOTP(email);
      setOtpSent(true);
      setCountdown(30);
      setSuccessMessage(res.message || "OTP code sent to your email! Use 123456 to test.");
    } catch (err) {
      setErrorMessage(err.message || "Failed to send OTP.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailOTP = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const result = await authService.verifyEmailOTP(email, otpCode);
      setSuccessMessage(`Logged in successfully with Email OTP!`);
      setCurrentUser(result.user);
    } catch (err) {
      setErrorMessage(err.message || "Invalid OTP code.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const result = await authService.loginWithGoogle();
      if (result) {
        setSuccessMessage("Logged in with Google successfully!");
        setCurrentUser(result.user);
      }
    } catch (err) {
      setErrorMessage(err.message || "Google login failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const res = await authService.resetPassword(email);
      setSuccessMessage(res.message || "Password reset instructions sent.");
    } catch (err) {
      setErrorMessage(err.message || "Failed to request password reset.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setSuccessMessage("Logged out successfully.");
  };

  return (
    <div className={`login-page-container${isAuthRoute ? " auth-route" : ""}`}>
      <div className="login-page">

        {/* Top Navbar matching Reference Image */}
        <header className="navbar">
          <div className="nav-left">
            <div className="nav-item">
              <span className="nav-who-icon"><WhoIAmIcon /></span>
              <span>Who We Are</span>
              <span className="arrow-down">⌄</span>
            </div>
          </div>

          <div className="logo">
            <EvolvLogo />
          </div>

          <div className="nav-right">
            {currentUser ? (
              <button className="login-nav-btn" onClick={handleLogout}>
                Logout ({currentUser.name || "User"})
              </button>
            ) : (
              <button className="login-nav-btn" onClick={() => switchTab("login")}>
                <ArrowRightIcon /> Login
              </button>
            )}

            <button className="signup-nav-btn" onClick={() => switchTab("signup")}>
              <span className="user-nav-icon"><UserIcon /></span> Start Evolving
            </button>
          </div>
        </header>

        {/* Hero Section matching Reference Image */}
        <main className="hero">
          <h1>
            Don't Just Scroll. EVOLV.
          </h1>

          <p className="hero-description">
            Discover skills, share what you know, and connect with people who help you grow.
          </p>

          {/* Pedestals in background floor */}
          <div className="podium podium-left"></div>
          <div className="podium podium-right"></div>

          {/* Floating Background Cards - Skill Discovery Bubbles */}
          <div className="floating-card card-left">
            <span className="small-avatar-circle">📸</span>
            <div>
              <b>Photography</b>
              <small>Visual storytelling</small>
            </div>
          </div>

          <div className="floating-card card-right">
            <span className="small-avatar-circle">🧠</span>
            <div>
              <b>Psychology</b>
              <small>Human behavior</small>
            </div>
          </div>

          <div className="likes-badge">
            <span className="heart-icon">💡</span> +1 Insight
          </div>

          <div className="followers-badge">
            <b>✦ +1 SKILL</b>
            <span>✦ +1 CONNECTION</span>
            <span>✦ +1 IDEA</span>
          </div>

          {/* Login Modal Card */}
          <section className="login-modal">

            {/* Left Art Illustration Panel */}
            <div className="login-art">
              <div className="art-logo">
                <EvolvLogo />
              </div>

              <h2>
                WELCOME
              </h2>

              <p className="art-sub-text">
                Your feed is waiting.
                <br />
                But this time, make it count.
              </p>

              {/* Floating Skill / Interest Tags */}
              <div className="skill-tags-wrap">
                <div className="skill-tag tag-design">🎨 Design</div>
                <div className="skill-tag tag-coding">💻 Coding</div>
                <div className="skill-tag tag-marketing">📈 Marketing</div>
                <div className="skill-tag tag-content">🎬 Filmmaking</div>
                <div className="skill-tag tag-strategy">🚀 Entrepreneurship</div>
              </div>

              {/* Vector Graphic Scene */}
              <ArtSceneIllustration />
            </div>

            {/* Right Form Area */}
            <div className="login-form-area">
              <button className="close-btn" aria-label="Close" onClick={() => switchMethod("email")}>
                ×
              </button>

              {/* Logged In Overlay State */}
              {currentUser ? (
                <div className="logged-in-view">
                  <h2>Welcome, <span>{currentUser.name || "User"}</span>!</h2>
                  <p className="user-email-badge">{currentUser.email || currentUser.phone}</p>
                  <div className="success-banner">✓ You are successfully authenticated.</div>
                  <button className="main-login-btn logout-action-btn" onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              ) : (
                <>
                  <div className="form-heading">
                    <h2>
                      {activeTab === "signup" ? (
                        isAuthRoute ? (
                          <>Create Your <span>Account</span></>
                        ) : (
                          <>Create an account on <span>evolv</span></>
                        )
                      ) : authMethod === "forgot_password" ? (
                        <>Reset <span>Password</span></>
                      ) : authMethod === "phone" ? (
                        <>Phone <span>Login</span></>
                      ) : authMethod === "email_otp" ? (
                        <>Email OTP <span>Login</span></>
                      ) : isAuthRoute ? (
                        <>Welcome <span>Back</span></>
                      ) : (
                        <>Login to <span>evolv</span></>
                      )}
                    </h2>

                    <p>
                      {!isAuthRoute
                        ? activeTab === "signup"
                          ? "Join EVOLV and start your journey of learning and discovery."
                          : "Access your account and continue your growth journey."
                        : activeTab === "signup"
                          ? "Join the community and start growing your skills."
                          : authMethod === "email"
                            ? "Sign in to continue your journey."
                            : "Access your account and continue your growth journey."}
                    </p>
                  </div>

                  {/* Feedback Alerts */}
                  {errorMessage && <div className="alert-banner alert-error">{errorMessage}</div>}
                  {successMessage && <div className="alert-banner alert-success">{successMessage}</div>}

                  {/* Login Tab Only
                  {authMethod !== "forgot_password" && (
                    <div className="auth-tabs auth-tabs-single">
                      <button
                        className="active-tab"
                        onClick={() => switchTab("login")}
                        type="button"
                      >
                        Login
                      </button>
                    </div>
                  )} */}

                  {/* METHOD 1: Email + Password Login OR Sign Up
                      Main page keeps the original form; /login and /signup use the auth form */}
                  {authMethod === "email" && isAuthRoute && (
                    <form onSubmit={handleEmailPasswordSubmit} noValidate>
                      {activeTab === "signup" && (
                        <>
                          <div className="field-group field-animate" style={{ "--i": 0 }}>
                            <div className={`input-group${fieldErrors.fullName ? " has-error" : ""}`}>
                              <span className="input-icon"><UserIcon /></span>
                              <input
                                type="text"
                                aria-label="Full Name"
                                placeholder="Enter your full name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                onBlur={() =>
                                  setFieldErrors((prev) => ({ ...prev, fullName: !fullName.trim() ? "Full name is required." : fullName.trim().length < 2 ? "Full name must be at least 2 characters." : "" }))
                                }
                              />
                            </div>
                            {fieldErrors.fullName && <span className="field-error">{fieldErrors.fullName}</span>}
                          </div>

                          <div className="field-group field-animate" style={{ "--i": 1 }}>
                            <div className={`input-group${fieldErrors.username ? " has-error" : ""}`}>
                              <span className="input-icon"><AtSignIcon /></span>
                              <input
                                type="text"
                                aria-label="Username"
                                placeholder="Choose a username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onBlur={() =>
                                  setFieldErrors((prev) => ({ ...prev, username: !username.trim() ? "Username is required." : username.trim().length < 3 ? "Username must be at least 3 characters." : !/^[a-zA-Z0-9_]+$/.test(username.trim()) ? "Use only letters, numbers and underscore." : "" }))
                                }
                              />
                            </div>
                            {fieldErrors.username && <span className="field-error">{fieldErrors.username}</span>}
                          </div>
                        </>
                      )}

                      <div
                        className="field-group field-animate"
                        style={{ "--i": activeTab === "signup" ? 2 : 0 }}
                      >
                        <div className={`input-group${fieldErrors.email ? " has-error" : ""}`}>
                          <span className="input-icon"><MailEnvelopeIcon /></span>
                          <input
                            type="email"
                            aria-label="Email"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onBlur={() => setFieldErrors((prev) => ({ ...prev, email: emailError(email) }))}
                          />
                        </div>
                        {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
                      </div>

                      <div className="field-group field-animate" style={{ "--i": activeTab === "signup" ? 3 : 1 }}>
                        <div className={`input-group${fieldErrors.password ? " has-error" : ""}`}>
                          <span className="input-icon"><LockOutlineIcon /></span>
                          <input
                            type={showPassword ? "text" : "password"}
                            aria-label="Password"
                            placeholder={activeTab === "signup" ? "Create a password" : "Enter your password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onBlur={() => setFieldErrors((prev) => ({ ...prev, password: passwordError(password) }))}
                          />

                          <button
                            type="button"
                            className="password-toggle"
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label="Toggle password visibility"
                          >
                            <EyeToggleIcon visible={showPassword} />
                          </button>
                        </div>
                        {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}

                        {activeTab === "signup" && (
                          <>
                            <div className="password-strength">
                              <div className="strength-bars">
                                <span className={passwordStrength.score >= 1 ? "on s1" : ""}></span>
                                <span className={passwordStrength.score >= 2 ? "on s2" : ""}></span>
                                <span className={passwordStrength.score >= 3 ? "on s3" : ""}></span>
                              </div>
                              <span className={`strength-label s${passwordStrength.score}`}>
                                {passwordStrength.label}
                              </span>
                            </div>

                            <div className="input-group confirm-password-group">
                              <span className="input-icon"><LockOutlineIcon /></span>
                              <input
                                type={showConfirmPassword ? "text" : "password"}
                                aria-label="Confirm Password"
                                placeholder="Confirm your password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                onBlur={() =>
                                  setFieldErrors((prev) => ({
                                    ...prev,
                                    confirmPassword: !confirmPassword
                                      ? "Confirm your password."
                                      : confirmPassword !== password
                                        ? "Passwords do not match."
                                        : "",
                                  }))
                                }
                              />

                              <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                aria-label="Toggle confirm password visibility"
                              >
                                <EyeToggleIcon visible={showConfirmPassword} />
                              </button>
                            </div>
                            {fieldErrors.confirmPassword && (
                              <span className="field-error">{fieldErrors.confirmPassword}</span>
                            )}
                          </>
                        )}
                      </div>

                      {activeTab === "login" && (
                        <div className="form-options">
                          <label className="remember">
                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <span className="custom-checkbox"></span>
                            Remember me
                          </label>

                          <button
                            type="button"
                            className="forgot-btn"
                            onClick={() => switchMethod("forgot_password")}
                          >
                            Forgot password?
                          </button>
                        </div>
                      )}

                      <button type="submit" className="main-login-btn" disabled={isLoading}>
                        {isLoading ? (
                          <span className="loader-spinner"></span>
                        ) : (
                          <>
                            {activeTab === "signup" ? "Create Account" : "Login"}{" "}
                            <span><ArrowRightIcon /></span>
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* METHOD 1 – ORIGINAL main page form (unchanged) */}
                  {authMethod === "email" && !isAuthRoute && (
                    <form onSubmit={handleEmailPasswordSubmit}>
                      {activeTab === "signup" && (
                        <div className="input-group">
                          <span className="input-icon"><UserIcon /></span>
                          <input
                            type="text"
                            placeholder="Full Name"
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            required
                          />
                        </div>
                      )}

                      <div className="input-group">
                        <span className="input-icon"><MailEnvelopeIcon /></span>
                        <input
                          type="email"
                          placeholder="Email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>

                      <div className="input-group">
                        <span className="input-icon"><LockOutlineIcon /></span>
                        <input
                          type={showPassword ? "text" : "password"}
                          placeholder="Password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />

                        <button
                          type="button"
                          className="password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label="Toggle password visibility"
                        >
                          <EyeToggleIcon visible={showPassword} />
                        </button>
                      </div>

                      {activeTab === "login" && (
                        <div className="form-options">
                          <label className="remember">
                            <input
                              type="checkbox"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                            />
                            <span className="custom-checkbox"></span>
                            Remember me
                          </label>

                          <button
                            type="button"
                            className="forgot-btn"
                            onClick={() => switchMethod("forgot_password")}
                          >
                            Forgot password?
                          </button>
                        </div>
                      )}

                      <button type="submit" className="main-login-btn" disabled={isLoading}>
                        {isLoading ? (
                          <span className="loader-spinner"></span>
                        ) : (
                          <>
                            {activeTab === "signup" ? "Create Account" : "Login"}{" "}
                            <span><ArrowRightIcon /></span>
                          </>
                        )}
                      </button>
                    </form>
                  )}

                  {/* METHOD 2: Phone + OTP Login */}
                  {authMethod === "phone" && (
                    <form onSubmit={otpSent ? handleVerifyPhoneOTP : handleSendPhoneOTP}>
                      <div className="input-group">
                        <select
                          className="country-select"
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          disabled={otpSent}
                        >
                          <option value="+1">🇺🇸 +1</option>
                          <option value="+91">🇮🇳 +91</option>
                          <option value="+44">🇬🇧 +44</option>
                          <option value="+61">🇦🇺 +61</option>
                          <option value="+81">🇯🇵 +81</option>
                        </select>

                        <input
                          type="tel"
                          placeholder="Phone Number"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          disabled={otpSent}
                          required
                        />
                      </div>

                      {otpSent && (
                        <div className="input-group">
                          <span className="input-icon">🔑</span>
                          <input
                            type="text"
                            placeholder="Enter 6-digit OTP (e.g. 123456)"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            maxLength={6}
                            required
                          />
                        </div>
                      )}

                      <button type="submit" className="main-login-btn" disabled={isLoading}>
                        {isLoading ? (
                          <span className="loader-spinner"></span>
                        ) : otpSent ? (
                          <>Verify & Login <span><ArrowRightIcon /></span></>
                        ) : (
                          <>Send OTP <span><ArrowRightIcon /></span></>
                        )}
                      </button>

                      {otpSent && (
                        <div className="otp-resend-row">
                          <button
                            type="button"
                            className="forgot-btn"
                            disabled={countdown > 0 || isLoading}
                            onClick={handleSendPhoneOTP}
                          >
                            {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
                          </button>

                          <button
                            type="button"
                            className="forgot-btn change-num-btn"
                            onClick={() => setOtpSent(false)}
                          >
                            Edit Number
                          </button>
                        </div>
                      )}
                    </form>
                  )}

                  {/* METHOD 3: Email OTP Login */}
                  {authMethod === "email_otp" && (
                    <form onSubmit={otpSent ? handleVerifyEmailOTP : handleSendEmailOTP}>
                      <div className="input-group">
                        <span className="input-icon"><MailEnvelopeIcon /></span>

                        <input
                          type="email"
                          placeholder="Email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={otpSent}
                          required
                        />
                      </div>

                      {otpSent && (
                        <div className="input-group">
                          <span className="input-icon">🔑</span>

                          <input
                            type="text"
                            placeholder="Enter 6-digit OTP (e.g. 123456)"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            maxLength={6}
                            required
                          />
                        </div>
                      )}

                      <button type="submit" className="main-login-btn" disabled={isLoading}>
                        {isLoading ? (
                          <span className="loader-spinner"></span>
                        ) : otpSent ? (
                          <>Verify & Login <span><ArrowRightIcon /></span></>
                        ) : (
                          <>Send Email OTP <span><ArrowRightIcon /></span></>
                        )}
                      </button>

                      {otpSent && (
                        <div className="otp-resend-row">
                          <button
                            type="button"
                            className="forgot-btn"
                            disabled={countdown > 0 || isLoading}
                            onClick={handleSendEmailOTP}
                          >
                            {countdown > 0 ? `Resend OTP in ${countdown}s` : "Resend OTP"}
                          </button>

                          <button
                            type="button"
                            className="forgot-btn change-num-btn"
                            onClick={() => setOtpSent(false)}
                          >
                            Change Email
                          </button>
                        </div>
                      )}
                    </form>
                  )}

                  {/* METHOD 4: Forgot Password Flow */}
                  {authMethod === "forgot_password" && (
                    <form onSubmit={handleForgotPasswordSubmit}>
                      <div className="input-group">
                        <span className="input-icon"><MailEnvelopeIcon /></span>

                        <input
                          type="email"
                          placeholder="Enter registered email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                        />
                      </div>

                      <button type="submit" className="main-login-btn" disabled={isLoading}>
                        {isLoading ? (
                          <span className="loader-spinner"></span>
                        ) : (
                          <>Send Reset Link <span><ArrowRightIcon /></span></>
                        )}
                      </button>

                      <div className="back-login-row">
                        <button
                          type="button"
                          className="forgot-btn"
                          onClick={() => switchMethod("email")}
                        >
                          ← Back to Login
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Divider matching Reference Image */}
                  <div className="divider">
                    <span></span>
                    <p>Or continue with</p>
                    <span></span>
                  </div>

                  {/* Social Login Buttons matching Reference Image */}
                  {isAuthRoute ? (
                    <>
                      <div className="social-buttons">
                        <button
                          type="button"
                          onClick={handleGoogleLogin}
                          className="google-wide"
                          disabled={isLoading}
                        >
                          <strong className="google"><GoogleIcon /></strong>
                          <span>Continue with Google</span>
                        </button>
                      </div>

                      <div className="social-buttons social-buttons-two">
                        <button
                          type="button"
                          onClick={() => switchMethod("phone")}
                          className={authMethod === "phone" ? "active-social" : ""}
                        >
                          <strong className="phone"><PhoneHandsetIcon /></strong>
                          <span>Phone</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => switchMethod("email_otp")}
                          className={authMethod === "email_otp" ? "active-social" : ""}
                        >
                          <strong className="email"><MailEnvelopeIcon /></strong>
                          <span>Email OTP</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="social-buttons">
                      <button
                        type="button"
                        onClick={handleGoogleLogin}
                        className={authMethod === "google" ? "active-social" : ""}
                        disabled={isLoading}
                      >
                        <strong className="google"><GoogleIcon /></strong>
                        <span>Google</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => switchMethod("phone")}
                        className={authMethod === "phone" ? "active-social" : ""}
                      >
                        <strong className="phone"><PhoneHandsetIcon /></strong>
                        <span>Phone</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => switchMethod("email_otp")}
                        className={authMethod === "email_otp" ? "active-social" : ""}
                      >
                        <strong className="email"><MailEnvelopeIcon /></strong>
                        <span>Email OTP</span>
                      </button>
                    </div>
                  )}

                  {/* Bottom Sign Up / Login Link */}
                  <p className="signup-text">
                    {activeTab === "signup" ? (
                      <>
                        Already have an account?{" "}
                        <button type="button" onClick={() => isAuthRoute ? switchTab("login") : switchTab("signup")}>
                          Login
                        </button>
                      </>
                    ) : (
                      <>
                        Don't have an account?{" "}
                        <button type="button" onClick={() => switchTab("signup")}>
                          Sign Up
                        </button>
                      </>
                    )}
                  </p>
                </>
              )}
            </div>
          </section>

          {/* Bottom Discover Card */}
          <div className="review-card">
            <div className="discover-number">01</div>
            <strong className="discover-label">DISCOVER</strong>
            <p>
              Find people, ideas and skills
              <br />
              that match your interests.
            </p>
          </div>

          {/* Bottom Features Card – Why EVOLV? */}
          <div className="features-card">
            <div className="features-card-title">BUILT DIFFERENT</div>

            <div>
              <span className="feature-icon">🧠</span>
              <p>Skill-first</p>
            </div>

            <div>
              <span className="feature-icon">🌱</span>
              <p>Meaningful content</p>
            </div>

            <div>
              <span className="feature-icon">🤝</span>
              <p>Real connections</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default LoginPage;
