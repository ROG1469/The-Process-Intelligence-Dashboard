/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AuthGuard from '@/components/AuthGuard';
import { useRouter, usePathname } from 'next/navigation';

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

global.localStorage = localStorageMock as any;

describe('AuthGuard Component', () => {
  const mockPush = jest.fn();
  const mockChildren = <div>Protected Content</div>;

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (usePathname as jest.Mock).mockReturnValue('/dashboard');
  });

  it('should redirect to login when no token exists', () => {
    localStorageMock.getItem.mockReturnValue(null);

    render(<AuthGuard>{mockChildren}</AuthGuard>);

    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('should show children when token exists', () => {
    localStorageMock.getItem.mockReturnValue('fake-token');

    render(<AuthGuard>{mockChildren}</AuthGuard>);

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('should not redirect on public paths', () => {
    (usePathname as jest.Mock).mockReturnValue('/login');
    localStorageMock.getItem.mockReturnValue(null);

    render(<AuthGuard>{mockChildren}</AuthGuard>);

    expect(mockPush).not.toHaveBeenCalled();
  });
});
