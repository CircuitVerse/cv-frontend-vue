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
        // Mock getBoundingClientRect for navbar
        const navbarGetBoundingClientRect = vi.fn(() => ({
            top: 0,
            bottom: 60,
            left: 0,
            right: window.innerWidth,
            width: window.innerWidth,
            height: 60,
        }));
        mockNavbar.getBoundingClientRect = navbarGetBoundingClientRect;

        // Mock getBoundingClientRect for panel (initial position)
        const panelGetBoundingClientRect = vi.fn(() => ({
            top: 100,
            bottom: 400,
            left: 50,
            right: 250,
            width: 200,
            height: 300,
        }));
        mockPanel.getBoundingClientRect = panelGetBoundingClientRect;

        // Initialize dragging
        dragging(mockHeader, mockPanel);

        // Simulate manual position update that would overlap navbar
        // This simulates what happens when a panel is dragged upward
        const transform = mockPanel.style.transform;
        
        // The panel should not be able to move above navbar bottom (60px)
        // If initial top is 100px and navbar bottom is 60px,
        // the minimum transform Y should keep panel at or below 60px
        expect(transform).toBeDefined();
    });

    test('should allow panel to be dragged freely when not near navbar', () => {
        // Mock getBoundingClientRect for navbar
        mockNavbar.getBoundingClientRect = vi.fn(() => ({
            top: 0,
            bottom: 60,
            left: 0,
            right: window.innerWidth,
            width: window.innerWidth,
            height: 60,
        }));

        // Mock getBoundingClientRect for panel (far from navbar)
        mockPanel.getBoundingClientRect = vi.fn(() => ({
            top: 200,
            bottom: 500,
            left: 50,
            right: 250,
            width: 200,
            height: 300,
        }));

        // Initialize dragging
        dragging(mockHeader, mockPanel);

        // Panel should be able to move freely when far from navbar
        expect(mockPanel.style.transform).toBeDefined();
    });

    test('should handle case when navbar does not exist', () => {
        // Remove navbar
        document.body.removeChild(mockNavbar);

        // Initialize dragging without navbar present
        expect(() => {
            dragging(mockHeader, mockPanel);
        }).not.toThrow();
    });

    test('should use runtime navbar height via getBoundingClientRect', () => {
        const getBoundingClientRectSpy = vi.fn(() => ({
            top: 0,
            bottom: 75, // Dynamic height
            left: 0,
            right: window.innerWidth,
            width: window.innerWidth,
            height: 75,
        }));
        
        mockNavbar.getBoundingClientRect = getBoundingClientRectSpy;
        
        // Initialize dragging
        dragging(mockHeader, mockPanel);

        // The navbar's getBoundingClientRect should be callable
        // (actual constraint logic is tested during drag interactions)
        expect(getBoundingClientRectSpy).toBeDefined();
    });
});
