// Hebrew letters for group assignment
export const HEBREW_LETTERS = [
  'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'כ', 'ל', 'מ', 'ן', 'נ', 'ס', 'ע', 'פ', 'צ', 'ק', 'ר', 'ש', 'ת'
];

export const ALL_GROUPS = 'ALL';

export function getVisibleKeys(userGroups: string[] = []): string[] {
  return userGroups.length > 0 ? [...userGroups, ALL_GROUPS] : [ALL_GROUPS];
}

export function formatGroupsDisplay(groups: string[] = []): string {
  if (!groups || groups.length === 0) {
    return 'לא משויך לקבוצה';
  }
  
  if (groups.includes(ALL_GROUPS)) {
    return 'כל הקבוצות';
  }
  
  return groups.join(', ');
}

export function canUserSeeEvent(userGroups: string[] = [], eventGroups: string[] = []): boolean {
  // If event has no groups set or includes ALL, everyone can see it
  if (!eventGroups || eventGroups.length === 0 || eventGroups.includes(ALL_GROUPS)) {
    return true;
  }
  
  // If user has no groups, they can only see ALL events
  if (!userGroups || userGroups.length === 0) {
    return eventGroups.includes(ALL_GROUPS);
  }
  
  // Check if user has any matching groups
  return userGroups.some(group => eventGroups.includes(group));
}