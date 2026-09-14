import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import StarRating from './StarRating';
import TrackingTimeline from './TrackingTimeline';
import { formatZmwPrice } from '../utils/currency';
import { TRACK_STEPS, STATUS_META } from '../utils/orderStore';

// These exercise the real components and helpers the pages use. A test that defines its
// own copy of a component proves nothing about the app.

describe('Prices', () => {
  test('are shown in kwacha, to two decimal places', () => {
    expect(formatZmwPrice(450)).toBe('ZMW 450.00');
    expect(formatZmwPrice('319.5')).toBe('ZMW 319.50');
  });

  test('round rather than run on', () => {
    expect(formatZmwPrice(12.345)).toBe('ZMW 12.35');
  });

  test('a missing price shows as zero rather than NaN', () => {
    expect(formatZmwPrice(undefined)).toBe('ZMW 0.00');
    expect(formatZmwPrice('not a number')).toBe('ZMW 0.00');
  });
});

describe('The star rating', () => {
  test('shows five stars', () => {
    render(<StarRating value={3} readOnly />);
    expect(screen.getAllByRole('button')).toHaveLength(5);
  });

  test('each star says how many it stands for', () => {
    render(<StarRating value={0} />);
    expect(screen.getByLabelText('1 star')).toBeInTheDocument();
    expect(screen.getByLabelText('5 stars')).toBeInTheDocument();
  });

  test('clicking a star reports that score', async () => {
    const onChange = jest.fn();
    render(<StarRating value={0} onChange={onChange} />);
    await userEvent.click(screen.getByLabelText('4 stars'));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  test('a read-only rating cannot be changed', async () => {
    const onChange = jest.fn();
    render(<StarRating value={2} onChange={onChange} readOnly />);
    await userEvent.click(screen.getByLabelText('5 stars'));
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('Order tracking', () => {
  test('shows every stage an order goes through', () => {
    render(<TrackingTimeline order={{ status: 'placed', tracking: [] }} />);
    TRACK_STEPS.forEach((step, index) => {
      expect(screen.getByText(`${index + 1}. ${STATUS_META[step].label}`)).toBeInTheDocument();
    });
  });

  test('a parcel waiting on a handover says so', () => {
    render(<TrackingTimeline order={{ status: 'pickup_requested', tracking: [] }} />);
    expect(screen.getByText(/the shop must confirm the handover/i)).toBeInTheDocument();
  });

  test('a note from the shop replaces the standard wording', () => {
    render(<TrackingTimeline order={{
      status: 'shipped',
      tracking: [{ status: 'shipped', note: 'The rider never arrived; back in the pool.' }],
    }} />);
    expect(screen.getByText(/the rider never arrived/i)).toBeInTheDocument();
  });

  test('stages still to come are marked as waiting', () => {
    render(<TrackingTimeline order={{ status: 'placed', tracking: [] }} />);
    expect(screen.getAllByText('Waiting').length).toBe(TRACK_STEPS.length - 1);
  });

  test('an order with no status yet still renders', () => {
    render(<TrackingTimeline order={undefined} />);
    expect(screen.getByText(/order placed/i)).toBeInTheDocument();
  });
});
