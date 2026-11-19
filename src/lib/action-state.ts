export interface ActionState {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
}

export const idleState: ActionState = { ok: false };

export type FormAction = (
  state: ActionState,
  formData: FormData,
) => Promise<ActionState>;
