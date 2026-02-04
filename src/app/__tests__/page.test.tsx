import { render, screen } from '@testing-library/react';
import Home from '../page';
import '@testing-library/jest-dom';

describe('Home Page', () => {
  it('renders the main headline and tagline', () => {
    render(<Home />);
    
    expect(screen.getByRole('heading', { name: /بانوتیک/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText('با دستان هنرمندت بدرخش')).toBeInTheDocument();
  });

  it('renders all service category cards', () => {
    render(<Home />);
    
    expect(screen.getByRole('heading', { name: 'خدمات زیبایی بانوان' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'آشپزی و غذای خانگی' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'خیاطی و طراحی مد' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'صنایع دستی و تزئینی' })).toBeInTheDocument();
  });

  it('renders the "Join our community" button', () => {
    render(<Home />);
    
    expect(screen.getByRole('link', { name: /به جامعه ما بپیوندید/i })).toBeInTheDocument();
  });
});
