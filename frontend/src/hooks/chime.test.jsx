import React from 'react';
import { render } from '@testing-library/react';
import { jest } from '@jest/globals';
import { fileURLToPath } from 'url';

// The chime sounds when a notification count rises — and stays quiet otherwise, which
// matters more: a sound on every poll, or on arriving at a busy dashboard, is a nuisance.

const playNotificationChime = jest.fn();
// Jest resolves a mocked path from its setup file rather than from here, so name it in full.
jest.unstable_mockModule(fileURLToPath(new URL('../utils/notificationChime.js', import.meta.url)), () => ({
  playNotificationChime,
  chimeEnabled: jest.fn(() => true),
  setChimeEnabled: jest.fn(),
  unlockChime: jest.fn(),
}));

const { default: useNotificationChime } = await import('./useNotificationChime');

function Bell({ count }) {
  useNotificationChime(count);
  return <span>{String(count)}</span>;
}

beforeEach(() => playNotificationChime.mockClear());

describe('The notification chime', () => {
  test('says nothing about what was already waiting when the page opened', () => {
    render(<Bell count={3} />);
    expect(playNotificationChime).not.toHaveBeenCalled();
  });

  test('sounds when something new arrives', () => {
    const { rerender } = render(<Bell count={1} />);
    rerender(<Bell count={2} />);
    expect(playNotificationChime).toHaveBeenCalledTimes(1);
  });

  test('stays quiet when the count is unchanged by a poll', () => {
    const { rerender } = render(<Bell count={2} />);
    rerender(<Bell count={2} />);
    rerender(<Bell count={2} />);
    expect(playNotificationChime).not.toHaveBeenCalled();
  });

  test('stays quiet when something is dealt with and the count falls', () => {
    const { rerender } = render(<Bell count={3} />);
    rerender(<Bell count={1} />);
    expect(playNotificationChime).not.toHaveBeenCalled();
  });

  test('sounds once per arrival, not once per item', () => {
    const { rerender } = render(<Bell count={0} />);
    rerender(<Bell count={4} />);
    expect(playNotificationChime).toHaveBeenCalledTimes(1);
  });

  test('ignores a count that is not yet known', () => {
    const { rerender } = render(<Bell count={null} />);
    rerender(<Bell count={undefined} />);
    expect(playNotificationChime).not.toHaveBeenCalled();
  });
});
