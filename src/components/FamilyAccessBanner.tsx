import React from 'react';
import { ShieldCheck, Eye } from 'lucide-react';
import { FamilyAccess } from '../utils/familyPermissions';

const ROLE_LABELS: Record<FamilyAccess['role'], string> = {
  configurator: 'Family configurator — full control',
  co_karta: 'Co-karta — ritual editing & invites',
  member: 'Member — mark performed & add occasions',
  viewer: 'Viewer — read-only family loop',
};

export const FamilyAccessBanner: React.FC<{ access: FamilyAccess }> = ({ access }) => {
  if (access.role === 'configurator') return null;

  return (
    <div
      className="rounded-xl border border-stone-200 bg-stone-100/80 px-4 py-2.5 flex items-start gap-2 text-xs text-stone-700"
      role="status"
    >
      {access.role === 'viewer' ? (
        <Eye className="w-4 h-4 text-stone-500 shrink-0 mt-0.5" aria-hidden />
      ) : (
        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
      )}
      <span>
        <strong className="text-stone-900 capitalize">{access.role.replace('_', ' ')}</strong>
        {' — '}
        {ROLE_LABELS[access.role]}
      </span>
    </div>
  );
};
