/**
 * Temporizador de inactividad: dispara `onTimeout` tras N minutos sin actividad.
 * Cualquier interacción debe llamar a `touch()` para reiniciarlo.
 * Lógica pura y testeable; el wiring con eventos de toque va en la Fase 5.
 * Ver SECURITY.md §7.
 */
export class InactivityTimer {
  private handle: ReturnType<typeof setTimeout> | null = null;
  private readonly timeoutMs: number;

  constructor(
    private readonly onTimeout: () => void,
    timeoutMinutes: number,
    private readonly scheduler: {
      set: (cb: () => void, ms: number) => ReturnType<typeof setTimeout>;
      clear: (h: ReturnType<typeof setTimeout>) => void;
    } = { set: setTimeout, clear: clearTimeout },
  ) {
    this.timeoutMs = timeoutMinutes * 60_000;
  }

  /** Inicia o reinicia el conteo de inactividad. */
  touch(): void {
    this.stop();
    this.handle = this.scheduler.set(() => this.onTimeout(), this.timeoutMs);
  }

  /** Detiene el temporizador (p. ej. al cerrar sesión). */
  stop(): void {
    if (this.handle !== null) {
      this.scheduler.clear(this.handle);
      this.handle = null;
    }
  }

  get isRunning(): boolean {
    return this.handle !== null;
  }
}
