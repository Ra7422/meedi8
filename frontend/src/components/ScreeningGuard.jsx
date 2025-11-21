import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ScreeningGuard - Wrapper component that redirects new users to screening
 *
 * Should NOT redirect when:
 * - User is a guest (is_guest = true)
 * - User has completed screening (has_completed_screening = true)
 * - User just completed screening (sessionStorage flag)
 * - Current route is the screening carousel itself
 * - User is not logged in
 */
export default function ScreeningGuard({ children }) {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Skip if no user or no token
    if (!user || !token) return;

    // Skip if user is a guest
    if (user.is_guest) return;

    // Skip if already completed screening
    if (user.has_completed_screening) return;

    // Skip if just completed screening (prevent redirect loop)
    if (typeof window !== 'undefined' && sessionStorage.getItem('screeningJustCompleted')) {
      sessionStorage.removeItem('screeningJustCompleted');
      return;
    }

    // Skip if already on screening page
    const screeningPaths = ['/screening-carousel', '/screening-test'];
    if (screeningPaths.some(path => location.pathname.startsWith(path))) return;

    // Skip if on auth pages (login, signup, etc.)
    const authPaths = ['/login', '/signup', '/verify-email', '/forgot-password', '/reset-password'];
    if (authPaths.some(path => location.pathname.startsWith(path))) return;

    // Skip if on public pages
    const publicPaths = ['/', '/faq', '/about', '/terms', '/subscription', '/onboarding'];
    if (publicPaths.includes(location.pathname)) return;

    // User needs to complete screening - redirect
    // Store current intended destination for after screening
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('screeningReturnTo', location.pathname);
    }

    navigate('/screening-carousel', { replace: true });
  }, [user, token, location.pathname, navigate]);

  return children;
}
