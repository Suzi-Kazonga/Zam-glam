import { saveProfileData, loadProfileData, getInitials } from './profileStorage';

describe('Profile metadata storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  test('keeps optional initials and photo data without touching the DB', () => {
    saveProfileData({ email: 'seller@zamglam.local', initials: 'SL', profilePhoto: 'data:image/png;base64,test' });

    expect(loadProfileData('seller@zamglam.local')).toMatchObject({
      initials: 'SL',
      profilePhoto: 'data:image/png;base64,test',
    });
    expect(getInitials('Samantha Lee')).toBe('SL');
  });
});
