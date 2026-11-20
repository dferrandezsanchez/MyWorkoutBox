import type { ClientRoutinePlan, ClientRoutinePlanItem } from '../../domain/shared/entities';

/** Item that corresponds next in the plan. Out-of-range positions fall back to the first item. */
export function nextPlanItem(plan: ClientRoutinePlan): ClientRoutinePlanItem | null {
  if (plan.items.length === 0) return null;
  return plan.items.find((item) => item.position === plan.nextPosition)
    ?? plan.items.find((item) => item.position === 1)
    ?? plan.items[0];
}

/** Cyclic advance A -> B -> C -> A for a plan with `size` items. */
export function followingPlanPosition(position: number, size: number): number {
  return (position % size) + 1;
}
