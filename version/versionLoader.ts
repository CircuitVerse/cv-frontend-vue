export const loadVersion = (version: string): Promise<void> => {
    return import(`../${version}/src/main.ts`)
        .then((module) => {
            console.log(`Loaded ${version}`)
        })
        .catch((err) => {
            console.error(`Failed to load ${version}`, err)
        })
}
