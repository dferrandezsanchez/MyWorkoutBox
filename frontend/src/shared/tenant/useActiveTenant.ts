import { useContext } from 'react';
import { ActiveTenantContext } from './context';

export function useActiveTenant() {
  const value = useContext(ActiveTenantContext);
  if (!value) throw new Error('useActiveTenant must be used inside ActiveTenantProvider');
  return value;
}
