import React, { useState } from 'react';
import { LineageMember, RitualResponsibility, Family } from '../types';
import { 
  Users, 
  Flame, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Search, 
  ShieldCheck, 
  BookOpen, 
  ChevronRight, 
  Heart, 
  Smartphone, 
  Sparkles,
  GitBranch,
  Calendar,
  Check,
  Globe,
  ExternalLink,
  X
} from 'lucide-react';

interface VisualFamilyTreeProps {
  family: Family;
  lineageMembers: LineageMember[];
  onOpenAddModal?: () => void;
  onUpdateLineageMember?: (member: LineageMember) => void;
  onNavigateToOccasion?: (occasionId?: string) => void;
  onPreviewWhatsApp?: (memberName: string, duty: RitualResponsibility) => void;
}

export const VisualFamilyTree: React.FC<VisualFamilyTreeProps> = ({
  family,
  lineageMembers: initialMembers,
  onOpenAddModal,
  onUpdateLineageMember,
  onNavigateToOccasion,
  onPreviewWhatsApp,
}) => {
  const [members, setMembers] = useState<LineageMember[]>(initialMembers);
  const [selectedMemberId, setSelectedMemberId] = useState<string>(initialMembers[0]?.id || '');
  const [filterGeneration, setFilterGeneration] = useState<'all' | '1' | '2' | '3'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddDutyModalOpen, setIsAddDutyModalOpen] = useState(false);

  // Sync internal state when props change
  React.useEffect(() => {
    setMembers(initialMembers);
    if (!selectedMemberId && initialMembers.length > 0) {
      setSelectedMemberId(initialMembers[0].id);
    }
  }, [initialMembers]);

  // New Duty state
  const [newOccasionTitle, setNewOccasionTitle] = useState('');
  const [newTithiOrDate, setNewTithiOrDate] = useState('');
  const [newRole, setNewRole] = useState<RitualResponsibility['role']>('Chief Karta (मुख्य कर्ता)');
  const [newSummary, setNewSummary] = useState('');
  const [newChecklistText, setNewChecklistText] = useState('');

  const selectedMember = members.find((m) => m.id === selectedMemberId) || members[0];

  const handleSelectMember = (id: string) => {
    setSelectedMemberId(id);
  };

  // Toggle checklist item within a responsibility
  const handleToggleChecklistItem = (dutyId: string, itemIdx: number) => {
    if (!selectedMember) return;

    const updatedResponsibilities = selectedMember.responsibilities.map((r) => {
      if (r.id === dutyId) {
        // Toggle item by recording status or updated checklist
        const isCompleted = r.status === 'completed';
        const nextStatus: RitualResponsibility['status'] = isCompleted ? 'in_progress' : 'completed';
        return {
          ...r,
          status: nextStatus,
        };
      }
      return r;
    });

    const updatedMember = {
      ...selectedMember,
      responsibilities: updatedResponsibilities,
    };

    setMembers((prev) => prev.map((m) => (m.id === selectedMember.id ? updatedMember : m)));
    if (onUpdateLineageMember) {
      onUpdateLineageMember(updatedMember);
    }
  };

  // Toggle full responsibility status
  const handleToggleDutyStatus = (dutyId: string) => {
    if (!selectedMember) return;

    const updatedResponsibilities = selectedMember.responsibilities.map((r) => {
      if (r.id === dutyId) {
        const nextStatus: RitualResponsibility['status'] = 
          r.status === 'pending' ? 'in_progress' : r.status === 'in_progress' ? 'completed' : 'pending';
        return {
          ...r,
          status: nextStatus,
        };
      }
      return r;
    });

    const updatedMember = {
      ...selectedMember,
      responsibilities: updatedResponsibilities,
    };

    setMembers((prev) => prev.map((m) => (m.id === selectedMember.id ? updatedMember : m)));
    if (onUpdateLineageMember) {
      onUpdateLineageMember(updatedMember);
    }
  };

  // Add new duty to current member
  const handleAddNewDuty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !newOccasionTitle.trim()) return;

    const checklistItems = newChecklistText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const newDuty: RitualResponsibility = {
      id: `duty_${Date.now()}`,
      occasionTitle: newOccasionTitle.trim(),
      role: newRole,
      tithiOrDate: newTithiOrDate.trim() || 'Annual Observance',
      dutySummary: newSummary.trim() || `Assigned ritual responsibility for ${selectedMember.name}.`,
      checklist: checklistItems.length > 0 ? checklistItems : ['Coordinate with family members', 'Observe sacred timing'],
      status: 'pending',
    };

    const updatedMember: LineageMember = {
      ...selectedMember,
      responsibilities: [...selectedMember.responsibilities, newDuty],
    };

    setMembers((prev) => prev.map((m) => (m.id === selectedMember.id ? updatedMember : m)));
    if (onUpdateLineageMember) {
      onUpdateLineageMember(updatedMember);
    }

    // Reset form
    setNewOccasionTitle('');
    setNewTithiOrDate('');
    setNewSummary('');
    setNewChecklistText('');
    setIsAddDutyModalOpen(false);
  };

  // Group members by generations
  const gen1Members = members.filter((m) => m.generation === 1);
  const gen2Members = members.filter((m) => m.generation === 2);
  const gen3Members = members.filter((m) => m.generation === 3);

  // Search filter
  const filterMember = (m: LineageMember) => {
    if (filterGeneration !== 'all' && String(m.generation) !== filterGeneration) {
      return false;
    }
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.name.toLowerCase().includes(q) ||
      (m.nameDevanagari && m.nameDevanagari.toLowerCase().includes(q)) ||
      m.relationship.toLowerCase().includes(q) ||
      m.location.toLowerCase().includes(q) ||
      m.primaryRole.toLowerCase().includes(q)
    );
  };

  // Guard against empty lineage (e.g. brand new family setup)
  if (!selectedMember || members.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="bg-white rounded-2xl border border-stone-200/90 p-8 sm:p-12 shadow-2xs text-center space-y-4">
          <div className="w-16 h-16 bg-amber-50 text-amber-700 rounded-full flex items-center justify-center mx-auto border border-amber-200">
            <GitBranch className="w-8 h-8 text-amber-600" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h3 className="text-xl font-bold font-serif-display text-stone-900">
              Lineage & Duties for {family.name}
            </h3>
            <p className="text-xs text-stone-500 leading-relaxed">
              No lineage members or ancestors mapped yet. As you record family occasions, kartas, and sacred duties, your multi-generational tree will appear here.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => {
                if (onOpenAddModal) {
                  onOpenAddModal();
                } else if (onNavigateToOccasion) {
                  onNavigateToOccasion();
                }
              }}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
            >
              + Record Ancestral Occasions
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Find relative objects for selected member
  const parents = (selectedMember.parentIds || [])
    .map((pid) => members.find((m) => m.id === pid))
    .filter(Boolean) as LineageMember[];

  const spouse = selectedMember.spouseId
    ? members.find((m) => m.id === selectedMember.spouseId)
    : undefined;

  const children = (selectedMember.childrenIds || [])
    .map((cid) => members.find((m) => m.id === cid))
    .filter(Boolean) as LineageMember[];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-7 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-800">
              <span className="flex items-center gap-1.5 uppercase tracking-wider">
                <GitBranch className="w-3.5 h-3.5 text-amber-600" />
                <span>Lineage & Gotra Tree (कुळवृक्ष व वंशपरंपरा)</span>
              </span>
              <span aria-hidden="true" className="text-stone-300">·</span>
              <span className="text-stone-600 font-serif font-medium">
                {family.traditionNotes ? family.traditionNotes.split('.')[0] : 'Kashyapa Gotra · Khandoba Kuldevta'}
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif-display text-stone-900 tracking-tight">
              Visual Family Lineage & Ritual Duties
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-3xl leading-relaxed">
              Every member across three generations carries designated sacred responsibilities (विहित कर्तव्ये) — from chief kartaship and priest coordination to diaspora linkages and youth apprenticeships. Select any family member to view and manage their duties.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 rounded-lg border border-amber-200/80 text-amber-900 text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-700" />
              <span>3 Generations Mapped</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 rounded-lg border border-stone-200 text-stone-700 text-xs font-medium">
              <Users className="w-3.5 h-3.5 text-stone-600" />
              <span>{members.length} Lineage Souls</span>
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="mt-6 pt-5 border-t border-stone-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs font-medium">
            <span className="text-stone-400 mr-1 shrink-0">View:</span>
            <button
              onClick={() => setFilterGeneration('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                filterGeneration === 'all'
                  ? 'bg-amber-800 text-white font-semibold shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              All Generations
            </button>
            <button
              onClick={() => setFilterGeneration('1')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                filterGeneration === '1'
                  ? 'bg-amber-800 text-white font-semibold shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Gen I · Ancestors & Elders
            </button>
            <button
              onClick={() => setFilterGeneration('2')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                filterGeneration === '2'
                  ? 'bg-amber-800 text-white font-semibold shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Gen II · Householders
            </button>
            <button
              onClick={() => setFilterGeneration('3')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                filterGeneration === '3'
                  ? 'bg-amber-800 text-white font-semibold shadow-2xs'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Gen III · Next-Gen Youth
            </button>
          </div>

          <div className="relative w-full sm:w-64 shrink-0">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Search member, role, gotra..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white text-stone-900 placeholder:text-stone-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Split Layout: Visual Family Tree on Left (7 cols), Selected Member Responsibilities on Right (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Generational Lineage Tree */}
        <div className="lg:col-span-7 space-y-6">
          {/* Generation 1: Ancestors & Elders */}
          {(filterGeneration === 'all' || filterGeneration === '1') && (
            <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs relative">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-600" />
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-serif">
                    Generation I · Ancestors & Matriarchs (प्रथम पिढी)
                  </h3>
                </div>
                <span className="text-xs text-stone-400">Patriarch Roots · Gotra: Kashyapa</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {gen1Members.filter(filterMember).map((m) => (
                  <MemberCard
                    key={m.id}
                    member={m}
                    isSelected={m.id === selectedMemberId}
                    onSelect={() => handleSelectMember(m.id)}
                  />
                ))}
              </div>

              {/* Connecting Tree Line */}
              {filterGeneration === 'all' && (
                <div className="flex justify-center my-4">
                  <div className="h-6 w-0.5 bg-amber-200 relative">
                    <div className="absolute -bottom-1.5 -left-1 w-2.5 h-2.5 rounded-full bg-amber-400 border border-white" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generation 2: Householders & Diaspora Siblings */}
          {(filterGeneration === 'all' || filterGeneration === '2') && (
            <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs relative">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-serif">
                    Generation II · Householders & Diaspora (द्वितीय पिढी)
                  </h3>
                </div>
                <span className="text-xs text-stone-400">Pillar Generation · Pune & Global</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {gen2Members.filter(filterMember).map((m) => (
                  <MemberCard
                    key={m.id}
                    member={m}
                    isSelected={m.id === selectedMemberId}
                    onSelect={() => handleSelectMember(m.id)}
                  />
                ))}
              </div>

              {/* Connecting Tree Line */}
              {filterGeneration === 'all' && (
                <div className="flex justify-center my-4">
                  <div className="h-6 w-0.5 bg-emerald-200 relative">
                    <div className="absolute -bottom-1.5 -left-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-white" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generation 3: Next Generation & Youth */}
          {(filterGeneration === 'all' || filterGeneration === '3') && (
            <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-2xs">
              <div className="flex items-center justify-between pb-4 border-b border-stone-100 mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                  <h3 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-serif">
                    Generation III · Next-Gen Youth (तृतीय पिढी)
                  </h3>
                </div>
                <span className="text-xs text-stone-400">Future Heritage Carriers</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {gen3Members.filter(filterMember).map((m) => (
                  <MemberCard
                    key={m.id}
                    member={m}
                    isSelected={m.id === selectedMemberId}
                    onSelect={() => handleSelectMember(m.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Selected Member Specific Ritual Responsibilities */}
        <div className="lg:col-span-5 space-y-6 sticky top-20">
          <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden">
            {/* Member Profile Banner */}
            <div className="bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white p-5 sm:p-6 relative overflow-hidden">
              <div className="absolute -top-12 -right-12 w-44 h-44 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-start gap-4 relative z-10">
                <div className="w-14 h-14 rounded-full bg-amber-100/10 border-2 border-amber-400/50 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                  {selectedMember.avatarUrl ? (
                    <img
                      src={selectedMember.avatarUrl}
                      alt={selectedMember.name}
                      className="w-full h-full object-cover"
                    />
                  ) : selectedMember.isAncestor ? (
                    <Flame className="w-7 h-7 text-amber-400" />
                  ) : (
                    <span className="text-xl font-bold font-serif text-amber-300">
                      {selectedMember.name.charAt(0)}
                    </span>
                  )}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-semibold text-amber-300">
                      {selectedMember.generationLabel.split('·')[0]}
                    </span>
                    {selectedMember.isAncestor && (
                      <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/40 px-2 py-0.5 rounded-full font-semibold">
                        Ancestor (पितृ)
                      </span>
                    )}
                    {selectedMember.isDiaspora && (
                      <span className="text-[10px] bg-blue-400/20 text-blue-300 border border-blue-400/40 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5" /> Diaspora
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold font-serif-display text-stone-100">
                    {selectedMember.name}
                  </h3>
                  {selectedMember.nameDevanagari && (
                    <p className="text-xs text-amber-200/90 font-devanagari font-medium">
                      {selectedMember.nameDevanagari}
                    </p>
                  )}
                  <p className="text-xs text-stone-300">
                    {selectedMember.relationship}
                  </p>
                </div>
              </div>

              {/* Lineage Meta Badges */}
              <div className="mt-4 pt-3 border-t border-stone-800 flex flex-wrap items-center gap-3 text-xs text-stone-300">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{selectedMember.location}</span>
                </div>
                <span className="text-stone-600">·</span>
                <div>
                  <span className="text-stone-400">Gotra:</span>{' '}
                  <span className="text-stone-200 font-semibold">{selectedMember.gotra}</span>
                </div>
                {selectedMember.kuldevta && (
                  <>
                    <span className="text-stone-600">·</span>
                    <div>
                      <span className="text-stone-400">Kuldevta:</span>{' '}
                      <span className="text-stone-200">{selectedMember.kuldevta}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Lineage Tree Ties (Immediate Kin Links) */}
            <div className="p-5 border-b border-stone-100 bg-stone-50/70">
              <div className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                <GitBranch className="w-3 h-3 text-amber-600" />
                <span>Lineage Relations in Record</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {parents.length > 0 && (
                  <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-stone-200 text-stone-700">
                    <span className="text-stone-400">Parents:</span>
                    {parents.map((p, i) => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectMember(p.id)}
                        className="text-amber-900 font-semibold hover:underline cursor-pointer"
                      >
                        {p.name}{i < parents.length - 1 ? ', ' : ''}
                      </button>
                    ))}
                  </div>
                )}
                {spouse && (
                  <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-stone-200 text-stone-700">
                    <span className="text-stone-400">Spouse:</span>
                    <button
                      onClick={() => handleSelectMember(spouse.id)}
                      className="text-amber-900 font-semibold hover:underline cursor-pointer"
                    >
                      {spouse.name}
                    </button>
                  </div>
                )}
                {children.length > 0 && (
                  <div className="flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-stone-200 text-stone-700">
                    <span className="text-stone-400">Children:</span>
                    {children.map((c, i) => (
                      <button
                        key={c.id}
                        onClick={() => handleSelectMember(c.id)}
                        className="text-amber-900 font-semibold hover:underline cursor-pointer"
                      >
                        {c.name}{i < children.length - 1 ? ', ' : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Ritual Responsibilities Section */}
            <div className="p-5 sm:p-6 space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-stone-900 uppercase tracking-wider font-serif">
                    Specific Ritual Responsibilities (विहित कर्तव्ये)
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5">
                    {selectedMember.responsibilities.length} active sacred observances assigned
                  </p>
                </div>

                <button
                  onClick={() => setIsAddDutyModalOpen(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Assign Duty</span>
                </button>
              </div>

              {/* Responsibilities List */}
              <div className="space-y-4">
                {selectedMember.responsibilities.length === 0 ? (
                  <div className="p-6 text-center bg-stone-50 rounded-xl border border-stone-200/80">
                    <BookOpen className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                    <p className="text-xs text-stone-500">No specific ritual duties assigned yet.</p>
                    <button
                      onClick={() => setIsAddDutyModalOpen(true)}
                      className="mt-3 text-xs text-amber-800 font-semibold hover:underline"
                    >
                      + Assign a ritual duty to {selectedMember.name}
                    </button>
                  </div>
                ) : (
                  selectedMember.responsibilities.map((duty) => (
                    <div
                      key={duty.id}
                      className={`p-4 rounded-xl border transition-all ${
                        duty.status === 'completed'
                          ? 'bg-emerald-50/50 border-emerald-200/80'
                          : duty.status === 'in_progress'
                          ? 'bg-amber-50/40 border-amber-200'
                          : 'bg-stone-50/70 border-stone-200/90'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded border border-amber-200/60 inline-block">
                            {duty.role}
                          </span>
                          <h5 className="text-sm font-bold text-stone-900 leading-snug">
                            {duty.occasionTitle}
                          </h5>
                          <div className="flex items-center gap-1.5 text-xs text-stone-500">
                            <Calendar className="w-3 h-3 text-amber-600" />
                            <span>{duty.tithiOrDate}</span>
                          </div>
                        </div>

                        {/* Status Toggle Button */}
                        <button
                          onClick={() => handleToggleDutyStatus(duty.id)}
                          className={`shrink-0 px-2.5 py-1 rounded-md text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1 ${
                            duty.status === 'completed'
                              ? 'bg-emerald-600 text-white shadow-2xs'
                              : duty.status === 'in_progress'
                              ? 'bg-amber-400 text-stone-900'
                              : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                          }`}
                          title="Click to toggle status"
                        >
                          {duty.status === 'completed' && <Check className="w-3 h-3" />}
                          <span className="capitalize">{duty.status.replace('_', ' ')}</span>
                        </button>
                      </div>

                      <p className="text-xs text-stone-600 mt-2.5 leading-relaxed">
                        {duty.dutySummary}
                      </p>

                      {/* Checklist */}
                      {duty.checklist && duty.checklist.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-stone-200/60 space-y-1.5">
                          <span className="text-[11px] font-semibold text-stone-700 block">
                            Preparation & Observance Steps:
                          </span>
                          {duty.checklist.map((step, idx) => (
                            <div
                              key={idx}
                              onClick={() => handleToggleChecklistItem(duty.id, idx)}
                              className="flex items-start gap-2 text-xs text-stone-600 group cursor-pointer"
                            >
                              <div
                                className={`w-3.5 h-3.5 rounded mt-0.5 border flex items-center justify-center shrink-0 transition-colors ${
                                  duty.status === 'completed'
                                    ? 'bg-emerald-600 border-emerald-600 text-white'
                                    : 'border-stone-300 group-hover:border-amber-500 bg-white'
                                }`}
                              >
                                {duty.status === 'completed' && <Check className="w-2.5 h-2.5" />}
                              </div>
                              <span className={duty.status === 'completed' ? 'line-through text-stone-400' : ''}>
                                {step}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Optional Notes */}
                      {duty.notes && (
                        <p className="mt-2 text-[11px] text-amber-900 bg-amber-50/80 p-2 rounded border border-amber-200/60 font-medium">
                          Note: {duty.notes}
                        </p>
                      )}

                      {/* Action Links */}
                      <div className="mt-3 pt-2 flex items-center justify-between text-xs">
                        {onPreviewWhatsApp && (
                          <button
                            onClick={() => onPreviewWhatsApp(selectedMember.name, duty)}
                            className="text-stone-500 hover:text-stone-800 flex items-center gap-1 cursor-pointer"
                          >
                            <Smartphone className="w-3 h-3 text-emerald-600" />
                            <span>Preview WhatsApp Reminder</span>
                          </button>
                        )}
                        {duty.occasionId && onNavigateToOccasion && (
                          <button
                            onClick={() => onNavigateToOccasion(duty.occasionId)}
                            className="text-amber-800 font-semibold hover:underline flex items-center gap-1 cursor-pointer ml-auto"
                          >
                            <span>View in Calendar</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Assign New Ritual Responsibility */}
      {isAddDutyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-xl overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-stone-100 bg-stone-50">
              <div>
                <h3 className="text-base font-bold text-stone-900 font-serif">
                  Assign Ritual Responsibility
                </h3>
                <p className="text-xs text-stone-500">
                  Assigning duty to <span className="font-semibold text-stone-800">{selectedMember.name}</span>
                </p>
              </div>
              <button
                onClick={() => setIsAddDutyModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddNewDuty} className="p-5 sm:p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Occasion or Ritual Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ganesh Chaturthi Modak Naivedya, Pitrupaksha Tarpanam"
                  value={newOccasionTitle}
                  onChange={(e) => setNewOccasionTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white text-stone-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Designated Role *
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as RitualResponsibility['role'])}
                    className="w-full text-xs px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white text-stone-900"
                  >
                    <option value="Chief Karta (मुख्य कर्ता)">Chief Karta (मुख्य कर्ता)</option>
                    <option value="Co-Host / Sankalpa (संकल्प व पूजा)">Co-Host / Sankalpa (संकल्प व पूजा)</option>
                    <option value="Samagri & Preparations (साहित्य व व्यवस्था)">Samagri & Preparations (साहित्य व व्यवस्था)</option>
                    <option value="Naivedya & Prasad (नैवेद्य व पाकसंस्कार)">Naivedya & Prasad (नैवेद्य व पाकसंस्कार)</option>
                    <option value="Priest Liaison (गुरुजी व पाठशाळा समन्वय)">Priest Liaison (गुरुजी व पाठशाळा समन्वय)</option>
                    <option value="Diaspora Link (विदेश समन्वय)">Diaspora Link (विदेश समन्वय)</option>
                    <option value="Apprentice & Youth (सहाय्यक संस्कार)">Apprentice & Youth (सहाय्यक संस्कार)</option>
                    <option value="Honoree & Elder Blessing (पूज्य आशीर्वाद)">Honoree & Elder Blessing (पूज्य आशीर्वाद)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    Tithi or Scheduled Timing
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bhadrapada Shukla Chaturthi"
                    value={newTithiOrDate}
                    onChange={(e) => setNewTithiOrDate(e.target.value)}
                    className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white text-stone-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Duty Description & Family Purpose
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe what this family member handles for this sacred observance..."
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white text-stone-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  Preparation Checklist (one item per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="Procure fresh durva and modak&#10;Set up copper puja thali&#10;Verify sunrise timing"
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-amber-500 focus:bg-white text-stone-900"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddDutyModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-stone-600 hover:text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-amber-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors cursor-pointer shadow-2xs"
                >
                  Save Duty to Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponent: Individual Member Card in the Visual Tree
interface MemberCardProps {
  member: LineageMember;
  isSelected: boolean;
  onSelect: () => void;
}

const MemberCard: React.FC<MemberCardProps> = ({ member, isSelected, onSelect }) => {
  const pendingCount = member.responsibilities.filter((r) => r.status === 'pending').length;
  const inProgressCount = member.responsibilities.filter((r) => r.status === 'in_progress').length;
  const completedCount = member.responsibilities.filter((r) => r.status === 'completed').length;

  return (
    <div
      onClick={onSelect}
      className={`p-4 rounded-xl border text-left transition-all cursor-pointer relative group ${
        isSelected
          ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/40 shadow-sm'
          : 'bg-white hover:bg-stone-50/80 border-stone-200/80 hover:border-stone-300 shadow-2xs'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Avatar / Portrait */}
        <div className="relative shrink-0">
          <div className="w-11 h-11 rounded-full bg-stone-100 border border-stone-200 overflow-hidden flex items-center justify-center">
            {member.avatarUrl ? (
              <img src={member.avatarUrl} alt={member.name} className="w-full h-full object-cover" />
            ) : member.isAncestor ? (
              <Flame className="w-5 h-5 text-amber-600" />
            ) : (
              <span className="text-sm font-bold font-serif text-stone-700">
                {member.name.charAt(0)}
              </span>
            )}
          </div>
          {member.isAncestor && (
            <span
              title="Ancestor Soul"
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center border border-white"
            >
              ॐ
            </span>
          )}
        </div>

        {/* Member Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-xs sm:text-sm font-bold text-stone-900 truncate font-serif">
              {member.name}
            </h4>
            {isSelected && (
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            )}
          </div>

          {member.nameDevanagari && (
            <p className="text-[11px] text-stone-500 font-devanagari truncate">
              {member.nameDevanagari}
            </p>
          )}

          <p className="text-[11px] text-stone-500 truncate mt-0.5">
            {member.relationship}
          </p>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-medium text-amber-900 bg-amber-100/70 px-1.5 py-0.5 rounded">
              {member.primaryRole.split('(')[0].trim()}
            </span>

            {member.isDiaspora && (
              <span className="text-[10px] font-medium text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200/60 flex items-center gap-0.5">
                <Globe className="w-2.5 h-2.5" /> Diaspora
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Duty Count Badge Footer */}
      <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
        <span className="flex items-center gap-1">
          <BookOpen className="w-3 h-3 text-amber-700" />
          <span>{member.responsibilities.length} Duties</span>
        </span>

        <div className="flex items-center gap-1 font-mono text-[10px]">
          {completedCount > 0 && (
            <span className="text-emerald-700 font-semibold" title={`${completedCount} completed`}>
              ✓{completedCount}
            </span>
          )}
          {inProgressCount > 0 && (
            <span className="text-amber-800 font-semibold" title={`${inProgressCount} in progress`}>
              ⚡{inProgressCount}
            </span>
          )}
          {pendingCount > 0 && (
            <span className="text-stone-400" title={`${pendingCount} pending`}>
              •{pendingCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
