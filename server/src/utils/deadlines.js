/**
 * Deadline Helper Utilities
 */

export function parseDeadline(deadlineStr, deadlineType = 'fixed') {
  if (deadlineType === 'rolling' || !deadlineStr || deadlineStr.toLowerCase().includes('rolling')) {
    return {
      status: 'rolling',
      label: 'Rolling Deadline',
      badgeColor: 'emerald',
      daysRemaining: null,
      isUrgent: false,
      isExpired: false
    };
  }

  const deadlineDate = new Date(deadlineStr);
  if (isNaN(deadlineDate.getTime())) {
    return {
      status: 'flexible',
      label: deadlineStr || 'Open',
      badgeColor: 'slate',
      daysRemaining: null,
      isUrgent: false,
      isExpired: false
    };
  }

  // Reference now date (Nov 4, 2026)
  const now = new Date();
  const diffMs = deadlineDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return {
      status: 'expired',
      label: `Expired (${Math.abs(daysRemaining)}d ago)`,
      badgeColor: 'slate',
      daysRemaining,
      isUrgent: false,
      isExpired: true
    };
  }

  if (daysRemaining <= 7) {
    return {
      status: 'urgent',
      label: daysRemaining === 0 ? 'Closes Today' : (daysRemaining === 1 ? '1 day left' : `${daysRemaining} days left`),
      badgeColor: 'rose',
      daysRemaining,
      isUrgent: true,
      isExpired: false
    };
  }

  return {
    status: 'upcoming',
    label: `${daysRemaining} days remaining`,
    badgeColor: 'amber',
    daysRemaining,
    isUrgent: false,
    isExpired: false
  };
}
