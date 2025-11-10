interface ProjectNameFunctions {
    setProjectName(name?: string): void;
    getProjectName(): string | undefined;
  }
  

  interface DownloadFunction {
    (name: string, imgType: string): void;
  }
  

  interface TabsOrderFunction {
    (): string[];
  }

  interface SaveData {
    name: string;
    timePeriod: number;
    clockEnabled: boolean;
    projectId: string;
    simulatorVersion: string;
    focussedCircuit: string;
    orderedTabs: string[];
    scopes: any[];
  }
  
  interface DependencyList {
    [id: string]: string[];
  }
  
  interface CompletedList {
    [id: string]: boolean;
  }
  
  interface GenerateSaveDataFunction {
    (name?: string, setName?: boolean): Promise<string | Error>;
  }
  
  interface DownloadFunction {
    (filename: string, text: string): void;
  }

  type ImgType = 'svg' | 'png'| 'jpg' 
  | 'jpeg' 
  | 'webp' 
  | 'bmp' 
  | 'gif' 
  | 'tiff' 
  | 'ico' 
  | 'avif'; 
  type ViewType = 'full' | 'partial'; 

  interface GenerateImageParams {
  imgType: ImgType;
  view: ViewType;
  transparent: boolean;
  resolution: number;
  down?: boolean;
}

  interface CropParams {
    dataURL: string;
    w: number;
    h: number;
  } 

  interface GenerateImageForOnlineReturn {
    data: string;
  }

  type Resolution = number;

  interface Headers {
    'Content-Type': string;
    'X-CSRF-Token': string | undefined;
    Authorization: string;
  }
  
  // Interface for the project data sent in the body of requests
  interface ProjectData {
    data: string;
    image: string;
    name: string;
  } 

  type SaveFunctionReturn = Promise<void>;