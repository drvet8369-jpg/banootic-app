import { render, screen } from '@testing-library/react';
import LoginPage from '../page';
import '@testing-library/jest-dom';

// Mock the server action
jest.mock('../actions', () => ({
  requestOtp: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('LoginPage', () => {
  it('renders the login form correctly', () => {
    render(<LoginPage />);

    expect(screen.getByRole('heading', { name: /ورود یا ثبت‌نام/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/شماره تلفن/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ارسال کد تایید/i })).toBeInTheDocument();
  });
});
