declare global {
  interface Window {
    projectId: string;
    data: Record<string, any>;
    logixProjectId: number;
    isUserLoggedIn: boolean;
    DPR: number;
    width: number;
    height: number;
    embed: boolean;
    lightMode: boolean;
  }
}

export interface ProjectData {
  timePeriod?: number;
  [key: string]: any;
}
