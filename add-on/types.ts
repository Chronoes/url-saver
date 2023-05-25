export enum Action {
  Startup = 'startup',
  View = 'view',
}

export type NativeAppPayload = {
  action: Action;
  tabId?: number;
};

export type StartupAction = NativeAppPayload & {
  action: Action.Startup;
  types: string[];
};

export function isPayload(value: unknown): value is NativeAppPayload {
  return (value as NativeAppPayload).action !== undefined;
}

export function isAction(value: unknown, action: Action.Startup): value is StartupAction;
export function isAction(value: unknown, action: Action): boolean {
  return (value as NativeAppPayload).action === action;
}
