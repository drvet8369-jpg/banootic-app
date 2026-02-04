import { render, screen } from '@testing-library/react';
import Footer from '../footer';

// Mock new Date() to get a consistent year for the tests.
const MOCK_DATE = new Date('2024-01-01T12:00:00.000Z');
const originalDate = global.Date;

beforeAll(() => {
  global.Date = class extends originalDate {
    constructor(dateString: any) {
      if (dateString) {
        // @ts-ignore
        return super(dateString);
      }
      return MOCK_DATE;
    }
  } as any;
});

afterAll(() => {
  global.Date = originalDate;
});


describe('Footer Component', () => {
  it('should render the copyright notice with the current year', () => {
    render(<Footer />);
    const currentYear = new Date().getFullYear();
    expect(screen.getByText(`© ${currentYear} بانوتیک. تمام حقوق محفوظ است.`)).toBeInTheDocument();
  });

  it('should render the tagline', () => {
    render(<Footer />);
    expect(screen.getByText('توانمندسازی بانوان، اتصال جوامع.')).toBeInTheDocument();
  });
});
