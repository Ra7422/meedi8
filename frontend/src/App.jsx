import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Logo } from "./components/ui";
import Login from "./pages/LoginNew";
import Signup from "./pages/Signup";
import EmailVerification from "./pages/EmailVerification";
import Rooms from "./pages/Rooms";
import SessionsDashboard from "./pages/SessionsDashboard";
import CreateRoom from "./pages/CreateRoom";
import CoachingChat from "./pages/CoachingChat";
import CoachingChatDemo from "./pages/CoachingChatDemo";
import CoachingChatDemoUser2 from "./pages/CoachingChatDemoUser2";
import CoachingSummaryDemo from "./pages/CoachingSummaryDemo";
import LobbyDemo from "./pages/LobbyDemo";
import MainRoomDemo from "./pages/MainRoomDemo";
import CongratsDemo from "./pages/CongratsDemo";
import InviteShare from "./pages/InviteShare";
import Lobby from "./pages/Lobby";
import MainRoom from "./pages/MainRoom";
import ResolutionComplete from "./pages/ResolutionComplete";
import WaitingRoom from "./pages/WaitingRoom";
import Onboarding from "./pages/Onboarding";
import Subscription from "./pages/Subscription";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import SubscriptionCancelled from "./pages/SubscriptionCancelled";
import Congratulations from "./pages/Congratulations";
import ChatSummary from "./pages/ChatSummary";
import Referrals from "./pages/Referrals";
import ReferralsDetail from "./pages/ReferralsDetail";
import Start from "./pages/Start";
import FAQ from "./pages/FAQ";
import About from "./pages/About";
import ScreeningTest from "./pages/ScreeningTest";
import ScreeningCarousel from "./pages/ScreeningCarousel";
import Profile from "./pages/Profile";
import Home from "./pages/Home";
import PlаsmicHost from "./plasmic-host";

function PrivateRoute({ children }) {
  // TEMPORARY: Authentication bypassed for testing
  // const { token } = useAuth();
  // if (!token) return <Navigate to="/login" replace />;
  return children;
}

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Use React Router's useLocation instead of window.location
  const [menuOpen, setMenuOpen] = React.useState(false);
  const [hoveredItem, setHoveredItem] = React.useState(null);
  const menuRef = React.useRef(null);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpen]);

  // Hide header on login, signup, email verification, onboarding, chat pages, and waiting room
  const hideHeader = ['/login', '/signup', '/verify-email', '/onboarding'].includes(location.pathname) ||
                     location.pathname.startsWith('/join/') ||
                     location.pathname.includes('/coaching/') ||
                     location.pathname.includes('/main-room/') ||
                     location.pathname.includes('/waiting/');

  if (hideHeader) return null;

  const styles = {
    nav: {
      padding: '10px 30px',
      background: 'linear-gradient(180deg, #EAF7F0 0%, #ffffff 100%)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'relative',
      zIndex: 10,
    },
    menuButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '10px',
    },
    menuIcon: {
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
    },
    menuBar: {
      width: '25px',
      height: '3px',
      backgroundColor: '#4cd3c2',
      borderRadius: '2px',
    },
    menuDropdown: {
      position: 'absolute',
      top: '50px',
      right: '0',
      background: '#6750A4',
      borderRadius: '12px',
      padding: '24px 32px',
      minWidth: '400px',
      boxShadow: '0 8px 24px rgba(103, 80, 164, 0.3)',
      zIndex: 1000,
    },
    menuGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px',
      marginBottom: '16px',
    },
    menuItem: {
      display: 'block',
      padding: '8px 12px',
      color: '#FFFFFF',
      textDecoration: 'none',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      background: 'none',
      border: 'none',
      borderRadius: '8px',
      fontFamily: "'Nunito', sans-serif",
      transition: 'all 0.2s',
      textAlign: 'center',
    },
    menuItemHover: {
      color: '#CCB2FF',
    },
    authButtonsContainer: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px',
      marginTop: '8px',
    },
    authButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10px 16px',
      color: '#6750A4',
      textDecoration: 'none',
      fontSize: '14px',
      fontWeight: '700',
      cursor: 'pointer',
      background: '#FFFFFF',
      border: 'none',
      borderRadius: '8px',
      fontFamily: "'Nunito', sans-serif",
      transition: 'all 0.2s',
      textAlign: 'center',
    },
    authButtonHover: {
      background: '#CCB2FF',
      color: '#FFFFFF',
    },
    logoutButton: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '10px 16px',
      color: '#FFFFFF',
      fontSize: '14px',
      fontWeight: '700',
      cursor: 'pointer',
      background: 'rgba(255, 255, 255, 0.2)',
      border: 'none',
      borderRadius: '8px',
      fontFamily: "'Nunito', sans-serif",
      transition: 'all 0.2s',
      textAlign: 'center',
      width: '100%',
      marginTop: '8px',
    },
    logoutButtonHover: {
      background: '#FFFFFF',
      color: '#6750A4',
    },
    userInfo: {
      padding: '0 0 12px 0',
      color: '#CCB2FF',
      fontSize: '14px',
      fontWeight: '700',
      borderBottom: '2px solid rgba(255, 255, 255, 0.2)',
      marginBottom: '16px',
      textAlign: 'center',
    },
  };

  return (
    <>
      <nav style={styles.nav}>
        <div>
          <Logo size={180} />
        </div>

        <div ref={menuRef} style={{ position: 'relative' }}>
        <button style={styles.menuButton} onClick={() => setMenuOpen(!menuOpen)}>
          <div style={styles.menuIcon}>
            <div style={styles.menuBar}></div>
            <div style={styles.menuBar}></div>
            <div style={styles.menuBar}></div>
          </div>
        </button>

        {menuOpen && (
          <div style={styles.menuDropdown}>
          {user && (
            <div style={styles.userInfo}>
              {user.name || user.email}
            </div>
          )}

          <div style={styles.menuGrid}>
            <Link
              to="/profile"
              style={{...styles.menuItem, ...(hoveredItem === 'profile' ? styles.menuItemHover : {})}}
              onClick={() => setMenuOpen(false)}
              onMouseEnter={() => setHoveredItem('profile')}
              onMouseLeave={() => setHoveredItem(null)}
            >Profile</Link>
            <Link
              to="/create"
              style={{...styles.menuItem, ...(hoveredItem === 'create' ? styles.menuItemHover : {})}}
              onClick={() => setMenuOpen(false)}
              onMouseEnter={() => setHoveredItem('create')}
              onMouseLeave={() => setHoveredItem(null)}
            >New Mediation</Link>
            <Link
              to="/faq"
              style={{...styles.menuItem, ...(hoveredItem === 'faq' ? styles.menuItemHover : {})}}
              onClick={() => setMenuOpen(false)}
              onMouseEnter={() => setHoveredItem('faq')}
              onMouseLeave={() => setHoveredItem(null)}
            >FAQ</Link>
            <Link
              to="/about"
              style={{...styles.menuItem, ...(hoveredItem === 'about' ? styles.menuItemHover : {})}}
              onClick={() => setMenuOpen(false)}
              onMouseEnter={() => setHoveredItem('about')}
              onMouseLeave={() => setHoveredItem(null)}
            >About</Link>
            <Link
              to="/subscription"
              style={{...styles.menuItem, ...(hoveredItem === 'subscription' ? styles.menuItemHover : {})}}
              onClick={() => setMenuOpen(false)}
              onMouseEnter={() => setHoveredItem('subscription')}
              onMouseLeave={() => setHoveredItem(null)}
            >Subscription</Link>
            <Link
              to="/referrals"
              style={{...styles.menuItem, ...(hoveredItem === 'referrals' ? styles.menuItemHover : {})}}
              onClick={() => setMenuOpen(false)}
              onMouseEnter={() => setHoveredItem('referrals')}
              onMouseLeave={() => setHoveredItem(null)}
            >Referrals</Link>
          </div>

          {/* Auth buttons section */}
          {user ? (
            <button
              onClick={() => { handleLogout(); setMenuOpen(false); }}
              style={{...styles.logoutButton, ...(hoveredItem === 'logout' ? styles.logoutButtonHover : {})}}
              onMouseEnter={() => setHoveredItem('logout')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              Logout
            </button>
          ) : (
            <div style={styles.authButtonsContainer}>
              <Link
                to="/login"
                style={{...styles.authButton, ...(hoveredItem === 'login' ? styles.authButtonHover : {})}}
                onClick={() => setMenuOpen(false)}
                onMouseEnter={() => setHoveredItem('login')}
                onMouseLeave={() => setHoveredItem(null)}
              >Login</Link>
              <Link
                to="/signup"
                style={{...styles.authButton, ...(hoveredItem === 'signup' ? styles.authButtonHover : {})}}
                onClick={() => setMenuOpen(false)}
                onMouseEnter={() => setHoveredItem('signup')}
                onMouseLeave={() => setHoveredItem(null)}
              >Sign Up</Link>
            </div>
          )}
          </div>
        )}
      </div>
    </nav>
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Header />
        <Routes>
          <Route path="/" element={<PrivateRoute><Home /></PrivateRoute>} />
          <Route path="/plasmic-host" element={<PlаsmicHost />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
          <Route path="/start" element={<PrivateRoute><Start /></PrivateRoute>} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/about" element={<About />} />
          <Route path="/screening-test" element={<PrivateRoute><ScreeningTest /></PrivateRoute>} />
          <Route path="/screening-carousel" element={<PrivateRoute><ScreeningCarousel /></PrivateRoute>} />
          <Route path="/rooms" element={<Navigate to="/profile" replace />} />
          <Route path="/sessions" element={<Navigate to="/profile" replace />} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/create" element={<PrivateRoute><CreateRoom /></PrivateRoute>} />
          <Route path="/rooms/:roomId/coaching" element={<PrivateRoute><CoachingChat /></PrivateRoute>} />
          <Route path="/coaching/:roomId" element={<PrivateRoute><CoachingChat /></PrivateRoute>} />
          <Route path="/coaching-demo" element={<CoachingChatDemo />} />
          <Route path="/coaching-demo-user2" element={<CoachingChatDemoUser2 />} />
          <Route path="/coaching-summary-demo" element={<CoachingSummaryDemo />} />
          <Route path="/lobby-demo" element={<LobbyDemo />} />
          <Route path="/main-room-demo" element={<MainRoomDemo />} />
          <Route path="/congrats-demo" element={<CongratsDemo />} />
          <Route path="/rooms/:roomId/invite" element={<PrivateRoute><InviteShare /></PrivateRoute>} />
          <Route path="/waiting/:roomId" element={<PrivateRoute><WaitingRoom /></PrivateRoute>} />
          <Route path="/rooms/:roomId/main-room" element={<PrivateRoute><MainRoom /></PrivateRoute>} />
          <Route path="/main-room/:roomId" element={<PrivateRoute><MainRoom /></PrivateRoute>} />
          <Route path="/rooms/:roomId/resolution" element={<PrivateRoute><ResolutionComplete /></PrivateRoute>} />
          <Route path="/rooms/:roomId/congratulations" element={<PrivateRoute><Congratulations /></PrivateRoute>} />
          <Route path="/rooms/:roomId/summary" element={<PrivateRoute><ChatSummary /></PrivateRoute>} />
          <Route path="/join/:inviteToken" element={<Lobby />} />
          <Route path="/referrals" element={<Referrals />} />
          <Route path="/referrals/detail" element={<ReferralsDetail />} />
          <Route path="/subscription" element={<PrivateRoute><Subscription /></PrivateRoute>} />
          <Route path="/subscription/success" element={<PrivateRoute><SubscriptionSuccess /></PrivateRoute>} />
          <Route path="/subscription/cancelled" element={<PrivateRoute><SubscriptionCancelled /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
