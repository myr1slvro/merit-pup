class LogoutEventBus {
  private target = new EventTarget();
  dispatch() {
    this.target.dispatchEvent(new Event("app-logout"));
  }
  on(handler: () => void) {
    this.target.addEventListener("app-logout", handler as EventListener);
    return () =>
      this.target.removeEventListener("app-logout", handler as EventListener);
  }
}
export const logoutEvent = new LogoutEventBus();
