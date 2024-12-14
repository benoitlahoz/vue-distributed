export const intersects = (existing: string[], registering: string[]) => {
  return existing.filter(Set.prototype.has, new Set(registering));
};
