export const loadVersion = (version: string): Promise<void> => {
  return import(`../${version}/src/main.ts`)
    .then(() => {
      // Version loaded successfully
    })
    .catch(err => {
      console.error(`Failed to load ${version}`, err);
    });
};
