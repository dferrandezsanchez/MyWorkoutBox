import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Avatar from '@shared/components/Avatar';

describe('Avatar', () => {
  it('renders an image when photoUrl exists', () => {
    render(<Avatar photoUrl="/uploads/client.jpg" firstName="Ana" lastName="Lopez" />);

    expect(screen.getByRole('img', { name: 'Foto de Ana Lopez' })).toHaveAttribute(
      'src',
      '/uploads/client.jpg',
    );
  });

  it('renders initials when photoUrl is missing', () => {
    render(<Avatar firstName="Ana" lastName="Lopez" />);

    expect(screen.getByLabelText('Foto de Ana Lopez')).toHaveTextContent('AL');
  });
});
