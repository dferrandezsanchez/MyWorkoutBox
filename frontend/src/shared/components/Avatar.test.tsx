import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import Avatar from '@shared/components/Avatar';

describe('Avatar', () => {
  it('renders client initials', () => {
    render(<Avatar firstName="Ana" lastName="Lopez" />);

    expect(screen.getByLabelText('Iniciales de Ana Lopez')).toHaveTextContent('AL');
  });
});
