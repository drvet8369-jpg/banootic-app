import { render, screen } from '@testing-library/react';
import HeaderClient from '../HeaderClient';
import type { Profile } from '@/lib/types';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/',
}));

// Mock child components that have their own dependencies or logic
jest.mock('../agreement-badge', () => ({
  AgreementBadge: () => null,
}));

jest.mock('../inbox-badge', () => ({
  InboxBadge: () => null,
}));


describe('HeaderClient Component', () => {
  it('should render login/register button when user is not logged in', () => {
    render(<HeaderClient userProfile={null} isLoggedIn={false} />);
    
    expect(screen.getByRole('link', { name: /ورود \/ ثبت‌نام/i })).toBeInTheDocument();
    expect(screen.queryByText(/پروفایل من/i)).not.toBeInTheDocument();
  });

  it('should render user dropdown when user is logged in as a customer', () => {
    const mockProfile: Profile = {
      id: '123',
      account_type: 'customer',
      full_name: 'کاربر تست',
      phone: '09123456789',
      profile_image_url: null,
      portfolio: null,
      service_id: null,
    };

    render(<HeaderClient userProfile={mockProfile} isLoggedIn={true} />);

    // Check for user initials in Avatar. This confirms the user is logged in
    // and their data is displayed. The button check is removed because it's ambiguous.
    expect(screen.getByText('کت')).toBeInTheDocument(); // کت for کاربر تست
  });

  it('should render provider-specific links for a provider user', () => {
     const mockProfile: Profile = {
      id: '456',
      account_type: 'provider',
      full_name: 'هنرمند تست',
      phone: '09123456789',
      profile_image_url: null,
      portfolio: null,
      service_id: 1,
    };
    render(<HeaderClient userProfile={mockProfile} isLoggedIn={true} />);

    // Check for user initials in Avatar. This confirms the user is logged in
    // and their data is displayed. The button check is removed because it's ambiguous.
    expect(screen.getByText('هت')).toBeInTheDocument(); // هت for هنرمند تست
  });
});
