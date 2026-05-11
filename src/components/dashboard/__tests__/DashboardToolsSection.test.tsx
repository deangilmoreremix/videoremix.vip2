import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, jest } from '@jest/globals';
import { SalesDropdown } from '../SalesDropdown';

// Mock sales copy data
const mockSalesCopy = {
  'video-creator': {
    tonality: 'professional',
    whatItDoes: 'Creates professional videos from keywords',
    howItMakesMoney: 'Monthly subscriptions and pay-per-video',
    whyBusinessesNeedIt: 'Video content drives engagement',
  },
};

describe('SalesDropdown', () => {
  it('renders expand button', () => {
    render(
      <SalesDropdown 
        salesCopy={mockSalesCopy['video-creator']} 
        isExpanded={false} 
        onToggle={() => {}} 
      />
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByTextContent('Learn More')).toBeInTheDocument();
  });

  it('toggles content on click', () => {
    const onToggleMock = jest.fn();
    render(
      <SalesDropdown 
        salesCopy={mockSalesCopy['video-creator']} 
        isExpanded={false} 
        onToggle={onToggleMock} 
      />
    );
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    expect(onToggleMock).toHaveBeenCalledTimes(1);
  });

  it('displays sales copy when expanded', () => {
    render(
      <SalesDropdown 
        salesCopy={mockSalesCopy['video-creator']} 
        isExpanded={true} 
        onToggle={() => {}} 
      />
    );
    expect(screen.getByTextContent('What It Does')).toBeInTheDocument();
    expect(screen.getByTextContent('Creates professional videos from keywords')).toBeInTheDocument();
    expect(screen.getByTextContent('How It Makes Money')).toBeInTheDocument();
    expect(screen.getByTextContent('Why Businesses Need It')).toBeInTheDocument();
  });

  it('handles missing sales copy gracefully', () => {
    render(
      <SalesDropdown 
        salesCopy={null} 
        isExpanded={true} 
        onToggle={() => {}} 
      />
    );
    // Should not crash, should show fallback or nothing
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('supports keyboard navigation', () => {
    render(
      <SalesDropdown 
        salesCopy={mockSalesCopy['video-creator']} 
        isExpanded={false} 
        onToggle={() => {}} 
      />
    );
    const button = screen.getByRole('button');
    button.focus();
    expect(button).toHaveFocus();
    
    fireEvent.keyDown(button, { key: 'Enter' });
    // onToggle should be called
  });
});
