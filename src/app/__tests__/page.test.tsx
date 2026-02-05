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
    
    // FIX: Changed from getByRole('heading') to getByText because CardTitle is a div.
    expect(screen.getByText('خدمات زیبایی بانوان')).toBeInTheDocument();
    expect(screen.getByText('آشپزی و غذای خانگی')).toBeInTheDocument();
    expect(screen.getByText('خیاطی و طراحی مد')).toBeInTheDocument();
    expect(screen.getByText('صنایع دستی و تزئینی')).toBeInTheDocument();
  });

  it('renders the "Join our community" button', () => {
    render(<Home />);
    
    expect(screen.getByRole('link', { name: /به جامعه ما بپیوندید/i })).toBeInTheDocument();
  });
});
