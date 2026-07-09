import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

// Hoisted shared state so mock factories can reference it
const h = vi.hoisted(() => ({
  mockApps: [
    { id: 'app-a', name: 'App A', description: 'Desc A', category: 'c', iconName: 'star', image: '', isActive: true, isPublic: true, group: 'g' },
    { id: 'app-b', name: 'App B', description: 'Desc B', category: 'c', iconName: 'star', image: '', isActive: true, isPublic: true, group: 'g' },
  ],
  ownedSet: new Set<string>(),
  userValue: null as any,
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = (await importOriginal()) as any
  return { ...actual, useNavigate: () => mockNavigate }
})
vi.mock('../hooks/useApps', () => ({
  useApps: () => ({ apps: h.mockApps, loading: false, error: null, refetch: vi.fn() }),
}))
vi.mock('../hooks/useUserAccess', () => ({
  useUserAccess: () => ({ hasAccessToApp: (id: string) => h.ownedSet.has(id) }),
}))
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({ user: h.userValue }),
}))
vi.mock('../components/PurchaseModal', () => ({
  default: ({ isOpen, app }: any) =>
    isOpen ? <div data-testid="purchase-modal">{app?.name}</div> : null,
}))

import ApplicationsPage from './ApplicationsPage'

beforeEach(() => {
  mockNavigate.mockClear()
  h.ownedSet = new Set()
  h.userValue = null
})

describe('ApplicationsPage — dashboard visibility & ownership gating', () => {
  it('shows ALL apps to every visitor (including logged-out users)', () => {
    render(
      <MemoryRouter>
        <ApplicationsPage />
      </MemoryRouter>,
    )
    // Both apps are visible
    expect(screen.getByText('App A')).toBeTruthy()
    expect(screen.getByText('App B')).toBeTruthy()
    // Logged-out visitor sees the sign-in prompt
    expect(screen.getByText(/Sign In to Access Your Apps/i)).toBeTruthy()
  })

  it('opens the purchase prompt when an unowned app is clicked', () => {
    render(
      <MemoryRouter>
        <ApplicationsPage />
      </MemoryRouter>,
    )
    // visitor is logged out -> no app is owned
    fireEvent.click(screen.getByText('App A'))
    const modal = screen.getByTestId('purchase-modal')
    expect(modal).toBeTruthy()
    expect(modal.textContent).toBe('App A')
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('navigates to the runner (does NOT prompt purchase) when an owned app is clicked', () => {
    h.userValue = { id: 'u1', email: 'owner@test.com' }
    h.ownedSet = new Set(['app-a'])

    render(
      <MemoryRouter>
        <ApplicationsPage />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText('App A'))
    expect(mockNavigate).toHaveBeenCalledWith('/ai-design-studio/app-a')
    expect(screen.queryByTestId('purchase-modal')).toBeNull()
  })

  it('still prompts purchase for an app the user does NOT own, even when signed in', () => {
    h.userValue = { id: 'u1', email: 'owner@test.com' }
    h.ownedSet = new Set(['app-a']) // app-b not owned

    render(
      <MemoryRouter>
        <ApplicationsPage />
      </MemoryRouter>,
    )
    fireEvent.click(screen.getByText('App B'))
    expect(screen.getByTestId('purchase-modal').textContent).toBe('App B')
    expect(mockNavigate).not.toHaveBeenCalled()
  })
})
