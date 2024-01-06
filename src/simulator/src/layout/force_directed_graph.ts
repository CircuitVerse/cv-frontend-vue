export class ForceNode {
  constructor(public x: number, public y: number, public vx: number, public vy: number, public reference: object) { }
}

export class ForceConnection {
  constructor(public node1: number, public node2: number) { }
}

export class ForceDirectedGraph {
  private kSpring: number = 0.1; // Spring constant
  private kRepel: number = 10.0; // Repulsion constant
  private damping: number = 0.9; // Damping factor
  private timestep: number = 0.1; // Time step for simulation

  constructor(private nodes: ForceNode[], private connections: ForceConnection[]) { }

  simulate(iterations: number): void {
    for (let iter = 0; iter < iterations; ++iter) {
      // Calculate forces
      this.calculateForces();

      // Update node positions
      this.updatePositions();

      // Apply damping to velocities
      this.applyDamping();

      this.printNodePositions();
    }
  }

  printNodePositions(): void {
    for (let i = 0; i < this.nodes.length; ++i) {
      console.log(`Node ${i}: (${this.nodes[i].x}, ${this.nodes[i].y})`);
    }
  }

  private calculateForces(): void {
    // Initialize forces
    const fx: number[] = new Array(this.nodes.length).fill(0.0);
    const fy: number[] = new Array(this.nodes.length).fill(0.0);

    // Calculate spring forces
    for (const connection of this.connections) {
      const node1 = connection.node1;
      const node2 = connection.node2;

      const dx = this.nodes[node2].x - this.nodes[node1].x;
      const dy = this.nodes[node2].y - this.nodes[node1].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      const force = this.kSpring * (distance - 70.0); // Adjust 1.0 as needed

      fx[node1] += force * dx / distance;
      fy[node1] += force * dy / distance;

      fx[node2] -= force * dx / distance;
      fy[node2] -= force * dy / distance;
    }

    // Calculate repulsion forces
    for (let i = 0; i < this.nodes.length; ++i) {
      for (let j = 0; j < this.nodes.length; ++j) {
        if (i !== j) {
          const dx = this.nodes[j].x - this.nodes[i].x;
          const dy = this.nodes[j].y - this.nodes[i].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          const force = this.kRepel / (distance * distance);

          fx[i] -= force * dx / distance;
          fy[i] -= force * dy / distance;
        }
      }
    }

    // Update velocities with forces
    for (let i = 0; i < this.nodes.length; ++i) {
      this.nodes[i].vx += fx[i];
      this.nodes[i].vy += fy[i];
    }
  }

  private updatePositions(): void {
    // Update node positions based on velocities
    for (const node of this.nodes) {
      node.x += node.vx * this.timestep;
      node.y += node.vy * this.timestep;
    }
  }

  private applyDamping(): void {
    // Dampen velocities
    for (const node of this.nodes) {
      node.vx *= this.damping;
      node.vy *= this.damping;
    }
  }
}
