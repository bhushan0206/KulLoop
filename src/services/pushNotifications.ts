import { Capacitor } from '@capacitor/core';
import { apiUrl } from '../utils/apiBase';
import { apiMutationHeaders } from '../utils/apiClientContext';

export type PushRegistrationResult =
  | { platform: 'web'; permission: NotificationPermission; token?: string }
  | { platform: 'native'; registered: boolean; token?: string; message?: string };

export interface PushBridgeContext {
  uid?: string;
  memberId?: string;
  familyId?: string;
}

export async function apiRegisterPushToken(payload: {
  token: string;
  platform: 'android' | 'web' | 'ios';
  uid?: string;
  memberId?: string;
  familyId?: string;
}): Promise<boolean> {
  try {
    const res = await fetch(apiUrl('/api/push/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function persistWebPseudoToken(ctx: PushBridgeContext): Promise<string | undefined> {
  const pseudo = `web_${ctx.uid || 'guest'}_${Date.now()}`;
  await apiRegisterPushToken({
    token: pseudo,
    platform: 'web',
    uid: ctx.uid,
    memberId: ctx.memberId,
    familyId: ctx.familyId,
  });
  return pseudo;
}

export async function registerForPushAlerts(ctx: PushBridgeContext = {}): Promise<PushRegistrationResult> {
  if (Capacitor.isNativePlatform()) {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const perm = await PushNotifications.requestPermissions();
      if (perm.receive !== 'granted') {
        return { platform: 'native', registered: false, message: 'Notification permission denied.' };
      }
      await PushNotifications.register();

      return new Promise((resolve) => {
        let settled = false;
        const finish = (value: PushRegistrationResult) => {
          if (settled) return;
          settled = true;
          resolve(value);
        };

        void (async () => {
          const registrationListener = await PushNotifications.addListener('registration', async (ev) => {
            const token = ev.value;
            await apiRegisterPushToken({
              token,
              platform: 'android',
              uid: ctx.uid,
              memberId: ctx.memberId,
              familyId: ctx.familyId,
            });
            await registrationListener.remove();
            finish({
              platform: 'native',
              registered: true,
              token,
              message: 'Android push registered with KulLoop.',
            });
          });

          const errorListener = await PushNotifications.addListener('registrationError', async (err) => {
            await registrationListener.remove();
            await errorListener.remove();
            finish({
              platform: 'native',
              registered: false,
              message: err.error || 'FCM registration failed. Add google-services.json to android/app/.',
            });
          });

          setTimeout(async () => {
            if (settled) return;
            await registrationListener.remove().catch(() => {});
            await errorListener.remove().catch(() => {});
            finish({
              platform: 'native',
              registered: true,
              message: 'Push requested — token will arrive when FCM is configured.',
            });
          }, 8000);
        })();
      });
    } catch (err) {
      console.warn('Native push registration unavailable:', err);
      return {
        platform: 'native',
        registered: false,
        message: 'Add google-services.json and FIREBASE_SERVICE_ACCOUNT for FCM.',
      };
    }
  }

  if (!('Notification' in window)) {
    return { platform: 'web', permission: 'denied' };
  }
  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    const token = await persistWebPseudoToken(ctx);
    return { platform: 'web', permission, token };
  }
  return { platform: 'web', permission };
}

/** Call once after sign-in so Android tokens sync to the server. */
export function initPushNotificationBridge(ctx: PushBridgeContext): () => void {
  if (!Capacitor.isNativePlatform()) {
    return () => {};
  }

  let cancelled = false;
  const runners: Array<{ remove: () => void }> = [];

  (async () => {
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const reg = await PushNotifications.addListener('registration', async (ev) => {
        if (cancelled) return;
        await apiRegisterPushToken({
          token: ev.value,
          platform: 'android',
          uid: ctx.uid,
          memberId: ctx.memberId,
          familyId: ctx.familyId,
        });
      });
      runners.push(reg);

      const recv = await PushNotifications.addListener('pushNotificationReceived', (notification) => {
        console.log('[KulLoop push received]', notification.title, notification.body);
      });
      runners.push(recv);

      await PushNotifications.register();
    } catch (e) {
      console.warn('Push bridge init skipped:', e);
    }
  })();

  return () => {
    cancelled = true;
    runners.forEach((r) => r.remove());
  };
}

export async function sendTestPush(uid?: string): Promise<string> {
  const res = await fetch(apiUrl('/api/push/test'), {
    method: 'POST',
    headers: await apiMutationHeaders(),
    body: JSON.stringify({ uid }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return data.error || data.message || 'Test push failed';
  if (data.simulated) return 'Token saved; FCM will deliver when service account is configured.';
  return 'Test notification sent.';
}
