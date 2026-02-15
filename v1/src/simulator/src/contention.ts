/**
 * Represents a node with bitWidth and value properties
 */
interface Node {
  bitWidth: number;
  value: number | undefined;
}

/**
 * @class ContentionPendingData
 *
 * Data structure to store pending contentions in the circuit.
 */
export default class ContentionPendingData {
  private contentionPendingMap: Map<Node, Set<Node>>;
  private totalContentions: number;

  constructor() {
    this.contentionPendingMap = new Map<Node, Set<Node>>();
    this.totalContentions = 0;
  }

  /**
   * Adds a contention between two nodes
   * @param ourNode The source node
   * @param theirNode The target node
   */
  add(ourNode: Node, theirNode: Node): void {
    if (this.contentionPendingMap.has(ourNode)) {
      const existingSet = this.contentionPendingMap.get(ourNode)!;
      if (!existingSet.has(theirNode)) this.totalContentions++;
      existingSet.add(theirNode);
      return;
    }

    this.totalContentions++;
    this.contentionPendingMap.set(ourNode, new Set<Node>([theirNode]));
  }

  /**
   * Checks if a node has any pending contentions
   * @param ourNode The node to check
   * @returns Whether the node has contentions
   */
  has(ourNode: Node): boolean {
    return this.contentionPendingMap.has(ourNode);
  }

  /**
   * Removes a specific contention entry
   * @param ourNode The source node
   * @param theirNode The target node
   */
  remove(ourNode: Node, theirNode: Node): void {
    if (
      !this.contentionPendingMap.has(ourNode) ||
      !this.contentionPendingMap.get(ourNode)!.has(theirNode)
    )
      return;

    this.contentionPendingMap.get(ourNode)!.delete(theirNode);
    if (this.contentionPendingMap.get(ourNode)!.size === 0) {
      this.contentionPendingMap.delete(ourNode);
    }
    this.totalContentions--;
  }

  /**
   * Removes all contentions for a specific node
   * @param ourNode The node to remove contentions for
   */
  removeAllContentionsForNode(ourNode: Node): void {
    if (!this.contentionPendingMap.has(ourNode)) return;

    const contentionsForOurNode = this.contentionPendingMap.get(ourNode)!;
    for (const theirNode of contentionsForOurNode) {
      this.remove(ourNode, theirNode);
    }
  }

  /**
   * Removes a contention if the nodes are resolved
   * @param ourNode The source node
   * @param theirNode The target node
   */
  removeIfResolved(ourNode: Node, theirNode: Node): void {
    if (
      ourNode.bitWidth === theirNode.bitWidth &&
      (ourNode.value === theirNode.value || ourNode.value === undefined)
    ) {
      this.remove(ourNode, theirNode);
    }
  }

  /**
   * Removes resolved contentions for a specific node
   * @param ourNode The node to check for resolved contentions
   */
  removeIfResolvedAllContentionsForNode(ourNode: Node): void {
    if (!this.contentionPendingMap.has(ourNode)) return;

    const contentionsForOurNode = this.contentionPendingMap.get(ourNode)!;
    for (const theirNode of contentionsForOurNode) {
      this.removeIfResolved(ourNode, theirNode);
    }
  }

  /**
   * @returns Total number of contentions
   */
  size(): number {
    return this.totalContentions;
  }

  /**
   * @returns List of all contention pairs
   */
  nodes(): [Node, Node][] {
    const items: [Node, Node][] = [];
    for (const [ourNode, contentionSet] of this.contentionPendingMap) {
      for (const theirNode of contentionSet) {
        items.push([ourNode, theirNode]);
      }
    }

    return items;
  }
}
