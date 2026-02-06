import { render, screen } from '@testing-library/react';
import RegisterPage from '../page';
import '@testing-library/jest-dom';

// Mock the server client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

// Mock child components that are not relevant to the test
jest.mock('../upgrade-form', () => ({
  UpgradeForm: () => <div data-testid="upgrade-form">Upgrade Form</div>,
}));

jest.mock('next/link', () => ({
    __esModule: true,
    default: ({ children, href }: { children: React.ReactNode, href: string }) => <a href={href}>{children}</a>
}));

const { createClient } = require('@/lib/supabase/server');

describe('Register Page (Account Upgrade Flow)', () => {
  
  beforeEach(() => {
    // Reset mocks before each test
    createClient.mockClear();
  });

  it('shows login prompt for unauthenticated users', async () => {
    // Arrange: Mock that the user is NOT logged in
    createClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      },
    });

    // Act
    const Page = await RegisterPage();
    render(Page);
    
    // Assert
    expect(screen.getByText(/برای ارائه خدمات خود، ابتدا باید وارد حساب کاربری خود شوید/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /ورود یا ثبت‌نام/i })).toBeInTheDocument();
    expect(screen.queryByTestId('upgrade-form')).not.toBeInTheDocument();
  });

  it('shows "already a provider" message for provider users', async () => {
    // Arrange: Mock that the user IS logged in and IS a provider
    createClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'provider-123' } } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: jest.fn().mockResolvedValue({ data: { id: 'provider-123', account_type: 'provider' }, error: null }),
          }),
        }),
      }),
    });

    // Act
    const Page = await RegisterPage();
    render(Page);
    
    // Assert
    expect(screen.getByText(/شما در حال حاضر یک هنرمند هستید/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /مشاهده داشبورد/i })).toBeInTheDocument();
    expect(screen.queryByTestId('upgrade-form')).not.toBeInTheDocument();
  });

  it('shows the upgrade form for logged-in customers', async () => {
    // Arrange: Mock that the user IS logged in and IS a customer
    createClient.mockReturnValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'customer-123' } } }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: jest.fn().mockResolvedValue({ data: { id: 'customer-123', account_type: 'customer', full_name: 'Customer Name' }, error: null }),
          }),
        }),
      }),
    });
    
    // Act
    const Page = await RegisterPage();
    render(Page);

    // Assert
    expect(screen.getByText(/به جامعه هنرمندان بانوتیک بپیوندید/i)).toBeInTheDocument();
    expect(screen.getByTestId('upgrade-form')).toBeInTheDocument();
  });
});
