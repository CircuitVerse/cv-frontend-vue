import interact from "interactjs";

interface Position {
  x: number;
  y: number;
}

function pinElementPosition(element: HTMLElement, positions: WeakMap<HTMLElement, Position>): void {
  if (!positions.has(element)) {
    const rect = element.getBoundingClientRect();
    element.style.top = `${rect.top}px`;
    element.style.bottom = "auto";
    positions.set(element, { x: 0, y: 0 });
  }
}

function updatePosition(
  element: HTMLElement,
  dx: number,
  dy: number,
  positions: WeakMap<HTMLElement, Position>,
): void {
  if (!element) return; // Check if the element is valid

  // If the element does not exist in the positions WeakMap, pin its current top position
  pinElementPosition(element, positions);

  // Update the element's x and y position
  const currentPosition = positions.get(element);
  if (!currentPosition) return; // Check if the currentPosition is valid
  currentPosition.x += dx;
  currentPosition.y += dy;

  // Apply the new position to the element using the CSS transform property
  element.style.transform = `translate(${currentPosition.x}px, ${currentPosition.y}px)`;
}

function disableSelection(element: HTMLElement): void {
  element.setAttribute("unselectable", "on");
  element.style.userSelect = "none";
  element.style.webkitUserSelect = "none";
  element.style.setProperty("-moz-user-select", "none");
  element.style.setProperty("-ms-user-select", "none");
  element.style.setProperty("-o-user-select", "none");
  element.onselectstart = () => false;
}

/**
 * Make an element draggable within a specified container.
 * @param {HTMLElement} targetEl - Element that triggers the drag event.
 * @param {HTMLElement} DragEl - Element to be dragged.
 */
export function dragging(targetEl: HTMLElement, DragEl: HTMLElement): void {
  // WeakMap to store the position of each dragged element
  const positions = new WeakMap<HTMLElement, Position>();

  // Initialize the interact.js library with the draggable element selector
  interact(DragEl).draggable({
    // Specify the element that triggers the drag event
    allowFrom: targetEl,
    // Set up event listeners for the draggable element
    listeners: {
      start(event) {
        const el = event.target as HTMLElement;
        pinElementPosition(el, positions);
        el.style.transition = "none";
      },
      // Update the element's position when the move event is triggered
      move(event) {
        updatePosition(event.target as HTMLElement, event.dx, event.dy, positions);
      },
      end(event) {
        const el = event.target as HTMLElement;
        el.style.transition = "";
      },
    },
    modifiers: [
      interact.modifiers.restrictRect({
        restriction: (_x, _y, interaction) => {
          const navbar = document.querySelector(".navbar");
          const topOffset = navbar ? navbar.getBoundingClientRect().bottom : 0;
          const panelHeight = (interaction?.element as HTMLElement)?.offsetHeight ?? 0;
          return {
            top: topOffset + window.scrollY,
            left: window.scrollX,
            bottom: Math.max(window.innerHeight, topOffset + panelHeight) + window.scrollY,
            right: window.innerWidth + window.scrollX,
          };
        },
      }),
    ],
  });

  $(DragEl)
    .off("mousedown.dragging")
    .on("mousedown.dragging", () => {
      $(`.draggable-panel:not(${DragEl})`).css("z-index", "99");
      $(DragEl).css("z-index", "99");
    });

  let panelElements = document.querySelectorAll(
    ".elementPanel, .layoutElementPanel, #moduleProperty, #layoutDialog, #verilogEditorPanel, .timing-diagram-panel, .testbench-manual-panel, .quick-btn",
  );

  panelElements.forEach((element) => {
    disableSelection(element as HTMLElement);
  });
}
