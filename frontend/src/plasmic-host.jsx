import React from 'react';
import { PlasmicCanvasHost, registerComponent } from '@plasmicapp/host';

// Import your components
import FAQ from './pages/FAQ';
import About from './pages/About';
import Referrals from './pages/Referrals';
import ReferralsDetail from './pages/ReferralsDetail';
import Start from './pages/Start';
import CreateRoom from './pages/CreateRoom';
import InviteShare from './pages/InviteShare';
import Subscription from './pages/Subscription';
import SubscriptionCancelled from './pages/SubscriptionCancelled';

// Register components so Plasmic can see them
registerComponent(FAQ, {
  name: 'FAQ',
  description: 'Frequently Asked Questions page with collapsible questions',
  props: {},
  importPath: './pages/FAQ',
});

registerComponent(About, {
  name: 'About',
  description: 'About / Our Story page',
  props: {},
  importPath: './pages/About',
});

registerComponent(Referrals, {
  name: 'Referrals',
  description: 'Referrals page with therapy options',
  props: {},
  importPath: './pages/Referrals',
});

registerComponent(ReferralsDetail, {
  name: 'ReferralsDetail',
  description: 'Detailed therapy service categories',
  props: {},
  importPath: './pages/ReferralsDetail',
});

registerComponent(Start, {
  name: 'Start',
  description: 'Post-onboarding start page',
  props: {},
  importPath: './pages/Start',
});

registerComponent(CreateRoom, {
  name: 'CreateRoom',
  description: 'Create new mediation room',
  props: {},
  importPath: './pages/CreateRoom',
});

registerComponent(InviteShare, {
  name: 'InviteShare',
  description: 'Share room invitation',
  props: {},
  importPath: './pages/InviteShare',
});

registerComponent(Subscription, {
  name: 'Subscription',
  description: 'Subscription management page',
  props: {},
  importPath: './pages/Subscription',
});

registerComponent(SubscriptionCancelled, {
  name: 'SubscriptionCancelled',
  description: 'Subscription cancelled confirmation',
  props: {},
  importPath: './pages/SubscriptionCancelled',
});

// Plasmic Canvas Host component - already inside Router from App.jsx
export default function PlаsmicHost() {
  return <PlasmicCanvasHost />;
}
