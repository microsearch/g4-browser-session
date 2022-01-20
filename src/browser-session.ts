/*
  G4BrowserSession represents a session maintained entirely in the browser.
  It is here mainly to support older apps created before the G4 session API
  existed.
*/

import * as g4 from "g4api-ts";
import { G4Api, G4ApiOptions } from "g4api-ts-support";

// Since session tokens expire in 15 minutes, setting the refresh interval to
// just under 5 minutes gives us 3 attempts to refresh the session token before
// we can no longer talk to the server.
const REFRESH_INTERVAL = 4.75 * 60 * 1000; // ms

export class G4BrowserSession extends G4Api {
  constructor(options: G4ApiOptions) {
    super(options);
    this.localStorageKey = `g4-${options.application ?? "app"}-session`;
    try {
      if (this.loadSession()) {
        this.intervalId = setInterval(
          () => this.syncRefresh(),
          REFRESH_INTERVAL
        );
      }
      this.syncRefresh();
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
      this.authentication = null;
    }
  }

  async connect(
    username: string,
    password: string
  ): Promise<g4.UserAuthenticationResponse> {
    if (this.connected()) {
      this.disconnect();
    }
    const response = (await this.auth.post({ username, password })).data;
    this.bearer = response.bearer;
    this.authentication = response.accessAllowed ? { ...response } : null;
    if (this.connected()) {
      this.intervalId = setInterval(() => this.syncRefresh(), REFRESH_INTERVAL);
    }
    this.saveSession();
    return response;
  }

  disconnect() {
    if (this.connected()) {
      this.authentication = null;
      this.saveSession();
      clearInterval(this.intervalId!);
    }
  }

  connected() {
    return this.authentication !== null && this.authentication.bearer !== null;
  }

  async refresh() {
    try {
      if (this.authentication !== null) {
        const response = (await this.auth.get()).data;
        this.authentication.username = response.username;
        this.authentication.claims = response.claims;
        this.authentication.bearer = response.bearer;
        this.bearer = response.bearer;
        this.saveSession();
      }
    } catch {
      this.authentication = null;
      this.saveSession();
    }
  }

  setSessionItem(key: string, value: string) {
    window.sessionStorage.setItem(key, value);
  }

  getSessionItem(key: string) {
    return window.sessionStorage.getItem(key);
  }

  get username(): string | null {
    return this.connected() ? this.authentication!.username : null;
  }

  get fullname() {
    return this.connected() ? this.authentication?.fullname : null;
  }

  get claims() {
    return this.authentication?.claims ?? [];
  }

  private syncRefresh() {
    (async () => await this.refresh())();
  }

  private loadSession() {
    const session = window.localStorage.getItem(this.localStorageKey);
    if (session === null) {
      this.authentication = null;
      window.localStorage.removeItem(this.localStorageKey);
    } else {
      this.authentication = JSON.parse(session);
      this.bearer = this.authentication!.bearer;
    }
    return this.connected();
  }

  private saveSession() {
    if (this.connected()) {
      window.localStorage.setItem(
        this.localStorageKey,
        JSON.stringify(this.authentication)
      );
    } else {
      window.localStorage.removeItem(this.localStorageKey);
    }
  }

  private localStorageKey: string;
  private intervalId: null | ReturnType<typeof setInterval> = null;
  private authentication: g4.UserAuthenticationResponse | null = null;
}
