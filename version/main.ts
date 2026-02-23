import { getConfiguredVersion } from "./config";
import { loadVersion } from "./versionLoader";

const version = getConfiguredVersion();
loadVersion(version);
