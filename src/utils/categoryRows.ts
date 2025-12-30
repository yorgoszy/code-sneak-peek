// Shared category rows organization for exercises
export const categoryRows = [
  // Row 1: Body Area
  ['upper body', 'lower body', 'total body', 'core', 'cardio'],
  // Row 2: Movement Pattern
  ['push', 'pull', 'rotational'],
  // Row 3: Direction
  ['vertical', 'horizontal', 'linear', 'lateral'],
  // Row 4: Stance
  ['bilateral', 'unilateral', 'ipsilateral'],
  // Row 5: Dominance
  ['hip dominate', 'knee dominate'],
  // Row 6: Training Type
  ['mobility', 'stability', 'activation', 'intergration', 'movement', 'neural activation', 'plyometric', 'power', 'strength', 'endurance', 'accesory', 'oly lifting', 'strongman', 'antirotation', 'antirotational', 'antiextention', 'antiflexion'],
  // Row 7: Equipment - all others
];

export const categoryRowLabels = [
  'Body Area',
  'Movement Pattern',
  'Direction',
  'Stance',
  'Dominance / Anti',
  'Training Type',
  'Equipment',
];

// Get all known category names (flat list)
export const getAllKnownCategories = (): string[] => {
  return categoryRows.flat();
};

// Check if a category is in the known rows
export const isKnownCategory = (categoryName: string): boolean => {
  return getAllKnownCategories().includes(categoryName.toLowerCase());
};

// Get the row index for a category (-1 if equipment/unknown)
export const getCategoryRowIndex = (categoryName: string): number => {
  const lowerName = categoryName.toLowerCase();
  for (let i = 0; i < categoryRows.length; i++) {
    if (categoryRows[i].includes(lowerName)) {
      return i;
    }
  }
  return -1; // Equipment row
};
