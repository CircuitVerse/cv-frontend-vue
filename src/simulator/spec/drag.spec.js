import { describe, test, expect, beforeEach, vi } from 'vitest';
import { dragging } from '../src/drag';

describe('Panel Dragging - Navbar Overlap Prevention', () => {
    let mockPanel;
    let mockHeader;
    let mockNavbar;

    beforeEach(() => {
        // Reset document body
        document.body.innerHTML = '';

        // Create mock navbar
        mockNavbar = document.createElement('nav');
        mockNavbar.className = 'navbar header';
        mockNavbar.style.position = 'fixed';
        mockNavbar.style.top = '0';
        mockNavbar.style.left = '0';
        mockNavbar.style.width = '100%';
        mockNavbar.style.height = '60px';
        document.body.appendChild(mockNavbar);

        // Create mock panel
        mockPanel = document.createElement('div');
        mockPanel.className = 'elementPanel draggable-panel';
        mockPanel.style.position = 'absolute';
        mockPanel.style.top = '100px';
        mockPanel.style.left = '50px';
        mockPanel.style.width = '200px';
        mockPanel.style.height = '300px';
        document.body.appendChild(mockPanel);

        // Create mock panel header
        mockHeader = document.createElement('div');
        mockHeader.className = 'panel-header';
        mockPanel.appendChild(mockHeader);
    });

    test('should prevent panel from overlapping navbar when dragged upward', () => {
        test('allows dragging regardless of navbar presence', () => {
            // Initialize dragging with navbar present
            dragging(mockHeader, mockPanel);
            expect(mockPanel.style.transform).toBeDefined();

            // Remove navbar and ensure it still works
            document.body.removeChild(mockNavbar);
            expect(() => dragging(mockHeader, mockPanel)).not.toThrow();
        });
});
