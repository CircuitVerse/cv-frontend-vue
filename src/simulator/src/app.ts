import {ApplicationMetadata} from './metadata';

/**
 *
 */
export class AppData {
  public circuitElementList: string[];
  public annotationList: string[];
  public inputList: string[];
  public subCircuitInputList: string[];
  public moduleList: string[];
  public updateOrder: string[];
  public renderOrder: string[];

  /**
   *
   */
  constructor() {
    this.circuitElementList = [];
    this.annotationList = [];
    this.inputList = [];
    this.subCircuitInputList = [];
    this.moduleList = [];
    this.updateOrder = []; // Order of update
    this.renderOrder = [];
  }

  /**
   * It initializes some useful array which are helpful
   * while simulating, saving and loading project.
   * It also draws icons in the sidebar
   * @param {*} applicationMetadata
   * @category setup
   */
  setupElementLists(applicationMetadata: ApplicationMetadata) {
    this.circuitElementList = applicationMetadata.circuitElementList;
    this.annotationList = applicationMetadata.annotationList;
    this.inputList = applicationMetadata.inputList;
    this.subCircuitInputList = applicationMetadata.subCircuitInputList;
    this.moduleList = [...this.circuitElementList, ...this.annotationList];
    this.updateOrder = [
      'wires',
      ...this.circuitElementList,
      'nodes',
      ...this.annotationList,
    ]; // Order of update
    this.renderOrder = [
      ...this.moduleList.slice().reverse(),
      'wires',
      'allNodes',
    ]; // Order of render
  }
}
