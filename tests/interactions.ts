import { act, screen } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";

/**
 * user-event's act wrapping does not cover a state update that happens synchronously
 * inside the interaction — a `window` keydown listener outside React's event system, a
 * store write in a click handler, or anything at all once fake timers are driving it. Each
 * of those produced `act(...)` warnings, and `.devin/rules/testing.md` treats new stderr
 * output as a defect, so interactions that touch an external store go through these.
 */

export async function click(user: UserEvent, name: RegExp | string): Promise<void> {
  const target = screen.getByRole("button", { name });
  await act(async () => {
    await user.click(target);
  });
}

export async function press(user: UserEvent, keys: string): Promise<void> {
  await act(async () => {
    await user.keyboard(keys);
  });
}
