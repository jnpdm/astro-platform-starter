import { useState, useMemo } from 'react';
import type { DocumentationSection, GateId, UserRole } from '@/types';

export interface DocumentationHubProps {
    sections: DocumentationSection[];
    contextual?: boolean;
    currentGate?: GateId;
    userRole?: UserRole;
}

export function DocumentationHub({
    sections,
    contextual = false,
    currentGate,
    userRole,
}: DocumentationHubProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedGate, setSelectedGate] = useState<GateId | 'all' | ''>('');
    const [selectedPhase, setSelectedPhase] = useState<string>('');
    const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

    // Extract unique gates, phases, and roles for filters
    const { gates, phases, roles } = useMemo(() => {
        const gatesSet = new Set<GateId | 'all'>();
        const phasesSet = new Set<string>();
        const rolesSet = new Set<UserRole>();

        sections.forEach((section) => {
            if (section.gate === 'all') {
                gatesSet.add('all');
            } else {
                gatesSet.add(section.gate as GateId);
            }
            if (section.phase) {
                phasesSet.add(section.phase);
            }
            section.relevantRoles.forEach((role) => rolesSet.add(role as UserRole));
        });

        return {
            gates: Array.from(gatesSet).sort(),
            phases: Array.from(phasesSet).sort(),
            roles: Array.from(rolesSet).sort(),
        };
    }, [sections]);

    // Filter sections based on search, gate, phase, and role
    const filteredSections = useMemo(() => {
        return sections.filter((section) => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesTitle = section.title.toLowerCase().includes(query);
                const matchesDescription = section.description.toLowerCase().includes(query);
                const matchesLinks = section.links.some(
                    (link) =>
                        link.title.toLowerCase().includes(query) ||
                        link.description?.toLowerCase().includes(query)
                );
                if (!matchesTitle && !matchesDescription && !matchesLinks) {
                    return false;
                }
            }

            // Gate filter
            if (selectedGate && selectedGate !== section.gate) {
                return false;
            }

            // Phase filter
            if (selectedPhase && section.phase !== selectedPhase) {
                return false;
            }

            // Role filter
            if (selectedRole && !section.relevantRoles.includes(selectedRole)) {
                return false;
            }

            // Contextual filtering (if enabled, filter by current gate and user role)
            if (contextual) {
                if (currentGate && section.gate !== currentGate && section.gate !== 'all') {
                    return false;
                }
                if (userRole && !section.relevantRoles.includes(userRole)) {
                    return false;
                }
            }

            return true;
        });
    }, [sections, searchQuery, selectedGate, selectedPhase, selectedRole, contextual, currentGate, userRole]);

    const toggleSection = (sectionId: string) => {
        setExpandedSections((prev) => {
            const next = new Set(prev);
            if (next.has(sectionId)) {
                next.delete(sectionId);
            } else {
                next.add(sectionId);
            }
            return next;
        });
    };

    const expandAll = () => {
        setExpandedSections(new Set(filteredSections.map((s) => s.id)));
    };

    const collapseAll = () => {
        setExpandedSections(new Set());
    };

    const clearFilters = () => {
        setSearchQuery('');
        setSelectedGate('');
        setSelectedPhase('');
        setSelectedRole('');
    };

    const getGateLabel = (gate: GateId | 'all'): string => {
        const labels: Record<GateId | 'all', string> = {
            'pre-contract': 'Pre-Contract',
            'gate-0': 'Gate 0',
            'gate-1': 'Gate 1',
            'gate-2': 'Gate 2',
            'gate-3': 'Gate 3',
            'post-launch': 'Post-Launch',
            'all': 'All Gates',
        };
        return labels[gate];
    };

    return (
        <div className="documentation-hub">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Documentation Hub</h2>
                <p className="text-gray-600">
                    Access resources organized by gate, phase, and role to support your onboarding activities.
                </p>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                {/* Search */}
                <div className="mb-4">
                    <label htmlFor="doc-search" className="block text-sm font-medium text-gray-700 mb-2">
                        Search Documentation
                    </label>
                    <input
                        id="doc-search"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search by title, description, or link..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    {/* Gate Filter */}
                    <div>
                        <label htmlFor="gate-filter" className="block text-sm font-medium text-gray-700 mb-1">
                            Filter by Gate
                        </label>
                        <select
                            id="gate-filter"
                            value={selectedGate}
                            onChange={(e) => setSelectedGate(e.target.value as GateId | 'all' | '')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Gates</option>
                            {gates.map((gate) => (
                                <option key={gate} value={gate}>
                                    {getGateLabel(gate)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Phase Filter */}
                    <div>
                        <label htmlFor="phase-filter" className="block text-sm font-medium text-gray-700 mb-1">
                            Filter by Phase
                        </label>
                        <select
                            id="phase-filter"
                            value={selectedPhase}
                            onChange={(e) => setSelectedPhase(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Phases</option>
                            {phases.map((phase) => (
                                <option key={phase} value={phase}>
                                    Phase {phase}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Role Filter */}
                    <div>
                        <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 mb-1">
                            Filter by Role
                        </label>
                        <select
                            id="role-filter"
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value as UserRole | '')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="">All Roles</option>
                            {roles.map((role) => (
                                <option key={role} value={role}>
                                    {role}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Filter Actions */}
                <div className="flex items-center justify-between">
                    <button
                        onClick={clearFilters}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        Clear Filters
                    </button>
                    <div className="flex gap-2">
                        <button
                            onClick={expandAll}
                            className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                        >
                            Expand All
                        </button>
                        <span className="text-gray-400">|</span>
                        <button
                            onClick={collapseAll}
                            className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                        >
                            Collapse All
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Count */}
            <div className="mb-4 text-sm text-gray-600">
                Showing {filteredSections.length} of {sections.length} documentation sections
            </div>

            {/* Documentation Sections */}
            <div className="space-y-4">
                {filteredSections.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                        <p className="text-gray-500">No documentation found matching your filters.</p>
                        <button
                            onClick={clearFilters}
                            className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Clear filters to see all documentation
                        </button>
                    </div>
                ) : (
                    filteredSections.map((section) => {
                        const isExpanded = expandedSections.has(section.id);

                        return (
                            <div
                                key={section.id}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                            >
                                {/* Section Header */}
                                <button
                                    onClick={() => toggleSection(section.id)}
                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex-1 text-left">
                                        <div className="flex items-center gap-3 mb-1">
                                            <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {getGateLabel(section.gate as GateId | 'all')}
                                                {section.phase && ` - Phase ${section.phase}`}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">{section.description}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-xs text-gray-500">Relevant for:</span>
                                            <div className="flex gap-1">
                                                {section.relevantRoles.map((role) => (
                                                    <span
                                                        key={role}
                                                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700"
                                                    >
                                                        {role}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <svg
                                            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'transform rotate-180' : ''
                                                }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </div>
                                </button>

                                {/* Section Content */}
                                {isExpanded && (
                                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                                        <div className="space-y-3">
                                            {section.links.map((link, index) => (
                                                <a
                                                    key={index}
                                                    href={link.url}
                                                    target={link.type === 'external' ? '_blank' : undefined}
                                                    rel={link.type === 'external' ? 'noopener noreferrer' : undefined}
                                                    className="block p-4 bg-white rounded-md border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all group"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2">
                                                                <h4 className="font-medium text-gray-900 group-hover:text-blue-600">
                                                                    {link.title}
                                                                </h4>
                                                                {link.type === 'external' && (
                                                                    <svg
                                                                        className="w-4 h-4 text-gray-400"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        viewBox="0 0 24 24"
                                                                    >
                                                                        <path
                                                                            strokeLinecap="round"
                                                                            strokeLinejoin="round"
                                                                            strokeWidth={2}
                                                                            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                                                        />
                                                                    </svg>
                                                                )}
                                                            </div>
                                                            {link.description && (
                                                                <p className="text-sm text-gray-600 mt-1">{link.description}</p>
                                                            )}
                                                        </div>
                                                        <svg
                                                            className="w-5 h-5 text-gray-400 group-hover:text-blue-600 ml-2 flex-shrink-0"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M9 5l7 7-7 7"
                                                            />
                                                        </svg>
                                                    </div>
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
