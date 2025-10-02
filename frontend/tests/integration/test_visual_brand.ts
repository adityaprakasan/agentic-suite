import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('Visual Branding Integration', () => {
  it('should display Adentic logo in header', () => {
    // This will fail until Header component is updated
    const Header = require('../../src/components/layout/Header').default;

    render(<Header />);

    const logo = screen.getByAltText(/adentic/i);
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '/logo.png');
  });

  it('should display copyright text in footer', () => {
    // This will fail until Footer component is updated
    const Footer = require('../../src/components/layout/Footer').default;

    render(<Footer />);

    expect(screen.getByText('© 2025 Adentic. All rights reserved.')).toBeInTheDocument();
  });

  it('should have LinkedIn link in footer', () => {
    const Footer = require('../../src/components/layout/Footer').default;

    render(<Footer />);

    const linkedinLink = screen.getByRole('link', { name: /linkedin/i });
    expect(linkedinLink).toHaveAttribute('href', 'https://www.linkedin.com/company/tryadentic');
  });

  it('should use brand primary color', () => {
    const Header = require('../../src/components/layout/Header').default;

    const { container } = render(<Header />);

    // Check for CSS variable
    const styles = getComputedStyle(container.firstChild as Element);
    expect(styles.getPropertyValue('--brand-primary')).toBe('#CC3A00');
  });

  it('should not display Kortix branding', () => {
    const Header = require('../../src/components/layout/Header').default;
    const Footer = require('../../src/components/layout/Footer').default;

    const { container: headerContainer } = render(<Header />);
    const { container: footerContainer } = render(<Footer />);

    expect(headerContainer.textContent).not.toContain('Kortix');
    expect(footerContainer.textContent).not.toContain('Kortix');
  });
});