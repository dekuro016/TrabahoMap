// Tiny shared state so the map can start its "fly into Batangas" animation only when the visitor can see it:
// after the intro animation AND the welcome screen are both gone. Each one "holds" while it is on screen.
let holds = 0;
const waiting: (() => void)[] = [];

export const intro = {
  get active() {
    return holds > 0;
  },
  /** Something full-screen started covering the site. */
  start() {
    holds++;
  },
  /** That full-screen thing is gone. When nothing is covering the site any more, waiting animations run. */
  finish() {
    holds = Math.max(0, holds - 1);
    if (holds === 0) waiting.splice(0).forEach((cb) => cb());
  },
  /** Run cb when nothing covers the site (or right away if nothing does). */
  whenDone(cb: () => void) {
    if (holds > 0) waiting.push(cb);
    else cb();
  },
};
