import { render, screen } from '@testing-library/react';
import SearchResultCard from '../search-result-card';
import type { Provider } from '@/lib/types';
import '@testing-library/jest-dom';

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  },
}));

// Targeted local mock for lucide-react to solve the ESM/CJS issue definitively for this test file.
jest.mock('lucide-react', () => {
    // This is a proxy to mock any icon from lucide-react
    return new Proxy({}, {
        get: function (target, prop) {
            // Return a dummy React component for any requested icon
            // This will mock User, Eye, MapPin, ShieldCheck, etc.
            return (props: any) => <svg {...props} data-testid={`lucide-icon-mock-${String(prop)}`} />;
        }
    });
});


describe('SearchResultCard', () => {
  const mockProvider: Provider = {
    id: 1,
    profile_id: 'uuid-1',
    name: 'هنرمند نمونه',
    service: 'خدمات نمونه',
    location: 'ارومیه',
    phone: '09123456789',
    bio: 'یک بیوگرافی نمونه',
    categorySlug: 'beauty',
    serviceSlug: 'manicure-pedicure',
    rating: 4.5,
    reviewsCount: 25,
    agreements_count: 10,
    last_activity_at: new Date().toISOString(),
    profileImage: {
      src: 'https://example.com/profile.jpg',
      aiHint: 'portrait',
    },
    portfolio: [],
  };

  it('renders provider information correctly', () => {
    render(<SearchResultCard provider={mockProvider} />);

    expect(screen.getByText('هنرمند نمونه')).toBeInTheDocument();
    expect(screen.getByText('خدمات نمونه')).toBeInTheDocument();
    expect(screen.getByText('ارومیه')).toBeInTheDocument();
    expect(screen.getByText('(25 نظر)')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument(); // agreements count
  });

  it('renders the profile link correctly', () => {
    render(<SearchResultCard provider={mockProvider} />);

    const link = screen.getByRole('link', { name: /مشاهده پروفایل/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', `/provider/${mockProvider.phone}`);
  });

  it('renders a placeholder when there is no profile image', () => {
    const providerWithoutImage = { ...mockProvider, profileImage: { src: '' } };
    render(<SearchResultCard provider={providerWithoutImage} />);
    
    // We can check for the presence of the User icon via its containing div
    const userIconContainer = screen.getByText('هنرمند نمونه').closest('.flex-col')?.querySelector('.bg-muted');
    expect(userIconContainer).toBeInTheDocument();
  });
});
