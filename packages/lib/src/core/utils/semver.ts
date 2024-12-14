// https://stackoverflow.com/a/52059759/1060921
export const isNewerVersion = (oldVersion: string, newVersion: string) => {
  // Remove 'alpha', 'beta', etc.
  oldVersion.replace(/[^0-9.]/g, '').trim();
  newVersion.replace(/[^0-9.]/g, '').trim();

  const oldParts = oldVersion.split('.');
  const newParts = newVersion.split('.');
  for (let i = 0; i < newParts.length; i++) {
    const a = ~~newParts[i]; // parse int
    const b = ~~oldParts[i]; // parse int
    if (a > b) return true;
    if (a < b) return false;
  }
  return false;
};

export const isOlderVersion = (oldVersion: string, newVersion: string) => {
  // Remove 'alpha', 'beta', etc.
  oldVersion.replace(/[^0-9.]/g, '').trim();
  newVersion.replace(/[^0-9.]/g, '').trim();

  const oldParts = oldVersion.split('.');
  const newParts = newVersion.split('.');
  for (let i = 0; i < newParts.length; i++) {
    const a = ~~newParts[i]; // parse int
    const b = ~~oldParts[i]; // parse int
    if (a < b) return true;
    if (a > b) return false;
  }
  return false;
};
