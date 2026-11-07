import { getFirebaseAdminApp, tryInitFirebaseAdmin, getFirebaseAdminModule } from './firebaseAdmin';

export interface PushDeviceRecord {
  id: string;
  token: string;
  platform: 'android' | 'web' | 'ios';
  familyId?: string;
  uid?: string;
  memberId?: string;
  updatedAt: string;
}

export async function sendFcmToToken(
  token: string,
  payload: { title: string; body: string; data?: Record<string, string> }
): Promise<{ sent: boolean; simulated?: boolean; error?: string }> {
  if (!tryInitFirebaseAdmin() || !getFirebaseAdminApp()) {
    console.log(`[FCM simulated] → ${token.slice(0, 12)}… title="${payload.title}"`);
    // Do not claim delivery — reminder worker must not dedupe on simulation
    return { sent: false, simulated: true };
  }

  // Messaging requires a service account credential, not projectId-only
  const hasServiceAccount =
    Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_PATH?.trim()) ||
    Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim());
  if (!hasServiceAccount) {
    console.log(`[FCM simulated — add service account] → ${token.slice(0, 12)}…`);
    return { sent: false, simulated: true };
  }

  try {
    const admin = getFirebaseAdminModule();
    await admin.messaging().send({
      token,
      notification: { title: payload.title, body: payload.body },
      data: payload.data,
      android: { priority: 'high' },
    });
    return { sent: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[FCM] send failed:', message);
    return { sent: false, error: message };
  }
}
