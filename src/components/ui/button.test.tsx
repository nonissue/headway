// @vitest-environment jsdom

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Button } from './button';

describe('Button', () => {
    it('renders a standard button with default classes', () => {
        render(<Button>Refresh</Button>);

        const button = screen.getByRole('button', { name: 'Refresh' });

        expect(button.getAttribute('data-slot')).toBe('button');
        expect(button.className).toContain('bg-primary');
        expect(button.className).toContain('h-9');
    });

    it('applies variant and size classes', () => {
        render(
            <Button variant="ghost" size="icon">
                Toggle
            </Button>
        );

        const button = screen.getByRole('button', { name: 'Toggle' });

        expect(button.className).toContain('hover:bg-accent');
        expect(button.className).toContain('size-9');
    });

    it('renders the child element when asChild is enabled', () => {
        render(
            <Button asChild className="underline">
                <a href="/stations">Stations</a>
            </Button>
        );

        const link = screen.getByRole('link', { name: 'Stations' });

        expect(link.getAttribute('href')).toBe('/stations');
        expect(link.getAttribute('data-slot')).toBe('button');
        expect(link.className).toContain('underline');
        expect(link.className).toContain('bg-primary');
    });
});
