import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { programFixture, routineFixture } from '@features/routines/test-fixtures';
import {
  useClientRoutinePlan,
  useClientRoutinePlanActions,
  useRoutine,
  useRoutineProgram,
  useRoutineProgramClients,
  useRoutinePrograms,
  useRoutines,
  useSaveRoutine,
  useSaveRoutineProgram,
  useSetRoutineProgramStatus,
  useSetRoutineStatus,
} from './useRoutines';

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() }));
vi.mock('@shared/api/http-client', () => ({ default: http }));
vi.mock('@features/auth/hooks/useCanManageRoutines', () => ({ useCanManageRoutines: () => true }));

const routine = routineFixture('tpl-a', 'Pierna');
const program = programFixture('prog-1', 'Fuerza 3 días', [routine]);

function setup() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  const invalidatedKeys = () => invalidate.mock.calls.map(([filters]) => filters?.queryKey);
  return { queryClient, wrapper, invalidatedKeys };
}

describe('routine program hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    http.get.mockImplementation((url: string) => Promise.resolve({
      data: url.endsWith('/clients') ? [{ clientId: 'c-1', firstName: 'Ana', lastName: 'Ruiz', nextPosition: 1 }]
        : url.startsWith('/routine-programs/') ? program
          : url.startsWith('/routine-programs') ? [program]
            : url.startsWith('/routines/') ? routine
              : url.startsWith('/routines') ? [routine]
                : null,
    }));
    http.post.mockResolvedValue({ data: program });
    http.put.mockResolvedValue({ data: program });
    http.patch.mockResolvedValue({ data: program });
    http.delete.mockResolvedValue({ data: undefined });
  });

  it('lists, gets and lists followers of programs', async () => {
    const { wrapper } = setup();
    const list = renderHook(() => useRoutinePrograms(true), { wrapper });
    const detail = renderHook(() => useRoutineProgram('prog-1'), { wrapper });
    const clients = renderHook(() => useRoutineProgramClients('prog-1'), { wrapper });
    await waitFor(() => expect(list.result.current.data).toEqual([program]));
    await waitFor(() => expect(detail.result.current.data).toEqual(program));
    await waitFor(() => expect(clients.result.current.data).toHaveLength(1));
    expect(http.get).toHaveBeenCalledWith('/routine-programs', { params: { includeInactive: 'true' } });
    expect(http.get).toHaveBeenCalledWith('/routine-programs/prog-1');
    expect(http.get).toHaveBeenCalledWith('/routine-programs/prog-1/clients');
  });

  it('creates and updates programs, refreshing programs, plans and session options', async () => {
    const { wrapper, invalidatedKeys } = setup();
    const { result } = renderHook(() => useSaveRoutineProgram(), { wrapper });
    const data = { name: 'Fuerza 3 días', notes: null, templateIds: ['tpl-a', 'tpl-a'] };
    await act(() => result.current.mutateAsync({ data }));
    expect(http.post).toHaveBeenCalledWith('/routine-programs', data);
    await act(() => result.current.mutateAsync({ id: 'prog-1', data }));
    expect(http.put).toHaveBeenCalledWith('/routine-programs/prog-1', data);
    expect(invalidatedKeys()).toEqual(expect.arrayContaining([
      ['routine-programs'],
      ['routine-program', 'prog-1', 'clients'],
      ['routine-plan'],
      ['training-session', 'options'],
    ]));
  });

  it('archives programs and refreshes dependents', async () => {
    const { wrapper, invalidatedKeys } = setup();
    const { result } = renderHook(() => useSetRoutineProgramStatus(), { wrapper });
    await act(() => result.current.mutateAsync({ id: 'prog-1', status: 'INACTIVE' }));
    expect(http.patch).toHaveBeenCalledWith('/routine-programs/prog-1/status', { status: 'INACTIVE' });
    expect(invalidatedKeys()).toEqual(expect.arrayContaining([['routine-programs'], ['routine-plan'], ['training-session', 'options']]));
  });
});

describe('routine template and plan hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    http.get.mockImplementation((url: string) => Promise.resolve({ data: url.startsWith('/routines/') ? routine : url.startsWith('/routines') ? [routine] : undefined }));
    http.post.mockResolvedValue({ data: routine });
    http.put.mockResolvedValue({ data: routine });
    http.patch.mockResolvedValue({ data: routine });
    http.delete.mockResolvedValue({ data: undefined });
  });

  it('loads routines, a routine and the client plan', async () => {
    const { wrapper } = setup();
    const list = renderHook(() => useRoutines(), { wrapper });
    const detail = renderHook(() => useRoutine('tpl-a'), { wrapper });
    const plan = renderHook(() => useClientRoutinePlan('client-1'), { wrapper });
    await waitFor(() => expect(list.result.current.data).toEqual([routine]));
    await waitFor(() => expect(detail.result.current.data).toEqual(routine));
    await waitFor(() => expect(plan.result.current.isSuccess).toBe(true));
    expect(plan.result.current.data).toBeNull();
    expect(http.get).toHaveBeenCalledWith('/routines', { params: undefined });
  });

  it('saves and archives templates, refreshing plans and programs that embed them', async () => {
    const { wrapper, invalidatedKeys } = setup();
    const save = renderHook(() => useSaveRoutine(), { wrapper });
    const status = renderHook(() => useSetRoutineStatus(), { wrapper });
    const data = { name: 'Pierna', notes: null, exercises: [] };
    await act(() => save.result.current.mutateAsync({ data }));
    await act(() => save.result.current.mutateAsync({ id: 'tpl-a', data }));
    await act(() => status.result.current.mutateAsync({ id: 'tpl-a', status: 'INACTIVE' }));
    expect(http.post).toHaveBeenCalledWith('/routines', data);
    expect(http.put).toHaveBeenCalledWith('/routines/tpl-a', data);
    expect(http.patch).toHaveBeenCalledWith('/routines/tpl-a/status', { status: 'INACTIVE' });
    expect(invalidatedKeys()).toEqual(expect.arrayContaining([['routines'], ['routine-plan'], ['routine-programs'], ['routine-program']]));
  });

  it('assigns a program or custom plan, changes next and removes it', async () => {
    const { wrapper, invalidatedKeys } = setup();
    const { result } = renderHook(() => useClientRoutinePlanActions('client-1'), { wrapper });
    await act(() => result.current.assign.mutateAsync({ programId: 'prog-1', nextPosition: 2 }));
    await act(() => result.current.assign.mutateAsync({ name: 'Serie', templateIds: ['tpl-a'] }));
    await act(() => result.current.setNext.mutateAsync(2));
    await act(() => result.current.remove.mutateAsync());
    expect(http.put).toHaveBeenCalledWith('/clients/client-1/routine-plan', { programId: 'prog-1', nextPosition: 2 });
    expect(http.put).toHaveBeenCalledWith('/clients/client-1/routine-plan', { name: 'Serie', templateIds: ['tpl-a'] });
    expect(http.patch).toHaveBeenCalledWith('/clients/client-1/routine-plan/next', { nextPosition: 2 });
    expect(http.delete).toHaveBeenCalledWith('/clients/client-1/routine-plan');
    expect(invalidatedKeys()).toEqual(expect.arrayContaining([
      ['routine-plan', 'client-1'],
      ['training-session', 'options', 'client-1'],
      ['routine-programs'],
    ]));
  });
});
