import { InactivityTimer } from '@/data/security';

describe('InactivityTimer', () => {
  it('dispara onTimeout tras el periodo de inactividad', () => {
    jest.useFakeTimers();
    const onTimeout = jest.fn();
    const timer = new InactivityTimer(onTimeout, 30); // 30 min

    timer.touch();
    expect(timer.isRunning).toBe(true);
    expect(onTimeout).not.toHaveBeenCalled();

    jest.advanceTimersByTime(30 * 60_000);
    expect(onTimeout).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('touch() reinicia el conteo (no expira si hay actividad)', () => {
    jest.useFakeTimers();
    const onTimeout = jest.fn();
    const timer = new InactivityTimer(onTimeout, 1); // 1 min

    timer.touch();
    jest.advanceTimersByTime(40_000); // 40s
    timer.touch(); // actividad: reinicia
    jest.advanceTimersByTime(40_000); // otros 40s (total 80s, pero reinició)
    expect(onTimeout).not.toHaveBeenCalled();

    jest.advanceTimersByTime(20_000); // completa el minuto desde el último touch
    expect(onTimeout).toHaveBeenCalledTimes(1);
    jest.useRealTimers();
  });

  it('stop() cancela el temporizador', () => {
    jest.useFakeTimers();
    const onTimeout = jest.fn();
    const timer = new InactivityTimer(onTimeout, 5);
    timer.touch();
    timer.stop();
    expect(timer.isRunning).toBe(false);
    jest.advanceTimersByTime(5 * 60_000);
    expect(onTimeout).not.toHaveBeenCalled();
    jest.useRealTimers();
  });
});
