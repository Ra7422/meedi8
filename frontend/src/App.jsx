import React from "react";
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { GamificationProvider } from "./context/GamificationContext";
import { ScoreEventToast, AchievementToast, StreakCelebrationModal, MilestoneOfferModal } from "./components/gamification";
import FloatingMenu from "./components/FloatingMenu";
import Login from "./pages/LoginNew";
import Signup from "./pages/Signup";
import EmailVerification from "./pages/EmailVerification";
import Rooms from "./pages/Rooms";
import SessionsDashboard from "./pages/SessionsDashboard";
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
import Terms from "./pages/Terms";
import ScreeningTest from "./pages/ScreeningTest";
import ScreeningCarousel from "./pages/ScreeningCarousel";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import Achievements from "./pages/Achievements";
import Home from "./pages/Home";
import TelegramConnect from "./pages/TelegramConnect";
import CreateSoloSession from "./pages/CreateSoloSession";
import PlаsmicHost from "./plasmic-host";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ScreeningGuard from "./components/ScreeningGuard";

function PrivateRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function GlobalMenu() {
  const location = useLocation();

  // Hide FloatingMenu on login, signup, email verification, onboarding, chat pages, waiting room, demo pages, and admin pages
  const hideMenu = ['/login', '/signup', '/verify-email', '/onboarding'].includes(location.pathname) ||
                   location.pathname.startsWith('/join/') ||
                   location.pathname.startsWith('/admin') ||
                   location.pathname.includes('/coaching/') ||
                   location.pathname.includes('/solo/') ||
                   location.pathname.includes('/main-room/') ||
                   location.pathname.includes('/waiting/');

  if (hideMenu) return null;

  return <FloatingMenu />;
}

export default function App() {
  return (
    <AuthProvider>
      <GamificationProvider>
        <ScoreEventToast />
        <AchievementToast />
        <StreakCelebrationModal />
        <Router>
          <MilestoneOfferModal />
          <GlobalMenu />
          <ScreeningGuard>
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/plasmic-host" element={<PlаsmicHost />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/verify-email" element={<EmailVerification />} />
          <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />
          <Route path="/start" element={<PrivateRoute><Start /></PrivateRoute>} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/about" element={<About />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/screening-test" element={<PrivateRoute><ScreeningTest /></PrivateRoute>} />
          <Route path="/screening-carousel" element={<PrivateRoute><ScreeningCarousel /></PrivateRoute>} />
          <Route path="/rooms" element={<PrivateRoute><Rooms /></PrivateRoute>} />
          <Route path="/sessions" element={<PrivateRoute><SessionsDashboard /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/achievements" element={<PrivateRoute><Achievements /></PrivateRoute>} />
          <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
          <Route path="/create" element={<PrivateRoute><CreateSoloSession /></PrivateRoute>} />
          <Route path="/rooms/:roomId/coaching" element={<PrivateRoute><CoachingChat /></PrivateRoute>} />
          <Route path="/coaching/:roomId" element={<PrivateRoute><CoachingChat /></PrivateRoute>} />
          {/* Solo mode temporarily disabled - will be added as new feature */}
          {/* <Route path="/rooms/:roomId/solo" element={<PrivateRoute><SoloCoaching /></PrivateRoute>} /> */}
          {/* <Route path="/solo/start" element={<PrivateRoute><StartSolo /></PrivateRoute>} /> */}
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
          <Route path="/subscription/success" element={<SubscriptionSuccess />} />
          <Route path="/subscription/cancelled" element={<SubscriptionCancelled />} />
          <Route path="/telegram" element={<PrivateRoute><TelegramConnect /></PrivateRoute>} />
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          </Routes>
          </ScreeningGuard>
        </Router>
      </GamificationProvider>
    </AuthProvider>
  );
}
