/*
  G4ServerSession represents a session created using the G4 session API.
  It is the preferred way to create G4 sessions in the browser.
*/

import * as g4 from "g4api-ts";
import { G4Api, G4ApiOptions } from "g4api-ts-support";

export class G4ServerSession extends G4Api {
  constructor(options: G4ApiOptions) {
    super(options);
    this.localStorageKey = `g4-${options.application ?? "app"}-session`;
    try {
      if (this.loadSession()) {
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
      this.authentication = null;
    }
  }

  async connect(
    username: string,
    password: string,
    data?: object
  ): Promise<g4.AuthenticatedSessionResponse> {
    if (this.connected()) {
      this.disconnect();
    }
    const response = (await this.session.post({ username, password, data }))
      .data;
    this.bearer = response.bearer;
    this.authentication = response.accessAllowed ? { ...response } : null;
    this.saveSession();
    return response;
  }

  async disconnect() {
    if (this.connected()) {
      await this.session.delete(this.authentication!.sessionId!);
      this.authentication = null;
      this.saveSession();
    }
  }

  connected() {
    return (
      this.authentication !== null && this.authentication.sessionId !== null
    );
  }

  async refresh() {
    await this.getSessionData();
  }

  async getSessionData(): Promise<object | null> {
    try {
      if (this.connected()) {
        const response = (
          await this.session.get(this.authentication!.sessionId!)
        ).data;
        this.bearer = response.bearer;
        this.saveSession();
        return response.data;
      }
    } catch (error: unknown) {
      this.authentication = null;
      this.saveSession();
    }
    return null;
  }

  async setSessionData(data: object | null) {
    try {
      if (this.connected()) {
        await this.session.put(this.authentication!.sessionId!, data);
      }
    } catch (error: unknown) {
      this.authentication = null;
      this.saveSession();
    }
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
  private authentication: g4.AuthenticatedSessionResponse | null = null;
}
