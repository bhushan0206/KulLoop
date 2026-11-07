export interface KulloopApiClientContext {
  uid: string;
  email: string;
  displayName: string;
  isDemoMode: boolean;
}

let ctx: KulloopApiClientContext = {
  uid: '',
  email: '',
  displayName: '',
  isDemoMode: false,
};

export function setApiClientContext(patch: Partial<KulloopApiClientContext>): void {
  ctx = { ...ctx, ...patch };
}

export function getApiClientContext(): KulloopApiClientContext {
  return ctx;
}

/** Headers for mutating API calls — prefers Firebase ID token when signed in. */
export async function apiMutationHeaders(extra?: HeadersInit): Promise<HeadersInit> {
  const base: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (ctx.isDemoMode) {
    base['x-kulloop-demo'] = '1';
  }
  if (ctx.uid) base['x-kulloop-uid'] = ctx.uid;
  if (ctx.email) base['x-kulloop-email'] = ctx.email;
  if (ctx.displayName) base['x-kulloop-display-name'] = ctx.displayName;

  try {
    const { auth } = await import('../services/firebase');
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      if (token) base.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Guest / demo — rely on demo header or unsigned fallback on server
  }

  return { ...base, ...(extra as Record<string, string>) };
}
