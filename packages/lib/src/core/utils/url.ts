export const getNameFromURL = (url: string) => {
  try {
    return (url as any)
      .split('/')
      .reverse()[0]
      .match(/^(.*?)\.umd/)[1];
  } catch (_err: unknown) {
    throw new Error(
      `URL is not valid: imported scripts must be bundled with 'umd' suffix.`
    );
  }
};

export const cleanURL = (url: string) => {
  return url.trim();
};
