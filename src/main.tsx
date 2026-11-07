import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { PrivacyPolicyPage } from './pages/PrivacyPolicyPage.tsx';
import './index.css';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';

const isPrivacyRoute =
  typeof window !== 'undefined' &&
  (window.location.pathname === '/privacy' || window.location.pathname === '/privacy/');

createRoot(document.getElementById('root')!).render(
  <>
    {isPrivacyRoute ? <PrivacyPolicyPage /> : <App />}
    <SpeedInsights />
    <Analytics />
  </>
);

