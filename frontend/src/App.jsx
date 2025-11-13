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
import SoloCoaching from "./pages/SoloCoaching";
import StartSolo from "./pages/StartSolo";
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
                     location.pathname.includes('/solo/') ||
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
      background: '#FFFFFF',
      border: '1px solid #E0E0E0',
      borderRadius: '12px',
      padding: '16px 0',
      minWidth: '260px',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      zIndex: 1000,
    },
    menuItem: {
      display: 'block',
      padding: '14px 24px',
      color: '#333333',
      textDecoration: 'none',
      fontSize: '16px',
      fontWeight: '500',
      cursor: 'pointer',
      background: 'none',
      border: 'none',
      fontFamily: "'Nunito', sans-serif",
      transition: 'all 0.2s',
      textAlign: 'left',
      width: '100%',
    },
    menuItemHover: {
      background: '#F5F5F5',
    },
    signupButton: {
      display: 'block',
      margin: '12px 16px 8px 16px',
      padding: '12px 20px',
      color: '#6750A4',
      textDecoration: 'none',
      fontSize: '15px',
      fontWeight: '700',
      cursor: 'pointer',
      background: '#F5EFFF',
      border: '2px solid #CCB2FF',
      borderRadius: '10px',
      fontFamily: "'Nunito', sans-serif",
      transition: 'all 0.2s',
      textAlign: 'center',
    },
    signupButtonHover: {
      background: '#CCB2FF',
      color: '#FFFFFF',
    },
    menuDivider: {
      height: '1px',
      background: '#E0E0E0',
      margin: '8px 0',
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
            <Link
              to="/about"
              style={{...styles.menuItem, ...(hoveredItem === 'about' ? styles.menuItemHover : {})}}
              onClick={() => setMenuOpen(false)}
              onMouseEnter={() => setHoveredItem('about')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              How It Works
            </Link>
            <Link
              to="/subscription"
              style={{...styles.menuItem, ...(hoveredItem === 'pricing' ? styles.menuItemHover : {})}}
              onClick={() => setMenuOpen(false)}
              onMouseEnter={() => setHoveredItem('pricing')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              Pricing
            </Link>
            <Link
              to="/faq"
              style={{...styles.menuItem, ...(hoveredItem === 'faq' ? styles.menuItemHover : {})}}
              onClick={() => setMenuOpen(false)}
              onMouseEnter={() => setHoveredItem('faq')}
              onMouseLeave={() => setHoveredItem(null)}
            >
              FAQ
            </Link>

            {!user && (
              <>
                <div style={styles.menuDivider}></div>
                <Link
                  to="/signup"
                  style={{...styles.signupButton, ...(hoveredItem === 'signup' ? styles.signupButtonHover : {})}}
                  onClick={() => setMenuOpen(false)}
                  onMouseEnter={() => setHoveredItem('signup')}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  New here? Create an account
                </Link>
              </>
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
          <Route path="/rooms" element={<PrivateRoute><Rooms /></PrivateRoute>} />
          <Route path="/sessions" element={<PrivateRoute><SessionsDashboard /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/create" element={<PrivateRoute><CreateRoom /></PrivateRoute>} />
          <Route path="/rooms/:roomId/coaching" element={<PrivateRoute><CoachingChat /></PrivateRoute>} />
          <Route path="/coaching/:roomId" element={<PrivateRoute><CoachingChat /></PrivateRoute>} />
          <Route path="/rooms/:roomId/solo" element={<PrivateRoute><SoloCoaching /></PrivateRoute>} />
          <Route path="/solo/start" element={<PrivateRoute><StartSolo /></PrivateRoute>} />
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
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/subscription/success" element={<PrivateRoute><SubscriptionSuccess /></PrivateRoute>} />
          <Route path="/subscription/cancelled" element={<PrivateRoute><SubscriptionCancelled /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
