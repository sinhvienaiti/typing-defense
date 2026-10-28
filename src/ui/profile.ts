/**
 * "Hồ sơ gõ" (docs/games/BALANCE.md §2): the card the title opens to show the player how they type, from the
 * profile kept under typing-defense.skill: speed, accuracy, the time to start a new word, evenness, one short
 * advice line (the kit's skillAdvice), and the pace the next run will take. Until enough has been measured the
 * numbers lean on the mode's defaults, and the card says so. Keyboard first: Enter or Esc closes.
 */
import { blendSkill, skillAdvice, type AdviceId, type SkillProfile } from "../kit/balance";

const ADVICE: Readonly<Record<AdviceId, string>> = {
  rest: "Your hands are slowing down. Take a short break.",
  "slow-down": "Ease your pace for fewer errors and more Perfect calls.",
  accuracy: "Focus on each letter. Speed will follow.",
  steady: "Keep an even pace across every word.",
  "new-words": "Read meanings and listen before typing unfamiliar words.",
  crowd: "When foes crowd in, finish one word before picking another.",
  "keep-going": "You're improving steadily. Keep it up!",
};

const fixed = (value: number, digits: number): string => value.toFixed(digits);

export class ProfileCard {
  readonly el: HTMLElement;

  constructor(private readonly done: () => void) {
    this.el = Object.assign(document.createElement("div"), { className: "td-profile", hidden: true });
    this.el.addEventListener("pointerdown", (event) => {
      if ((event.target as Element).closest("button") !== null) this.done();
    });
  }

  get shown(): boolean {
    return !this.el.hidden;
  }

  /** Shows the profile and the next run's pace k (null: the director is off). */
  open(profile: SkillProfile, k: number | null): void {
    const view = blendSkill(profile);
    const measured = Math.min(view.confidence.e, view.confidence.a);
    const row = (label: string, value: string, note = ""): string => `<dt>${label}</dt><dd>${value}${note === "" ? "" : `<small>${note}</small>`}</dd>`;
    this.el.innerHTML =
      `<h3>Profile</h3><dl>` +
      row("Speed", Math.round(view.e) + " WPM") +
      row("Accuracy", Math.round(view.a * 100) + "%") +
      row("New-word read", fixed(view.recognize.new, 1) + " s") +
      row("Steadiness", Math.round(Math.max(0, 1 - view.cv) * 100) + "%") +
      row("Next pace", k === null ? "Off" : "×" + fixed(k, 2), k === null ? "adaptive off" : k > 1.005 ? "above normal" : k < 0.995 ? "below normal" : "normal") +
      `</dl><p class="td-profile-advice">${profile.trend.stages === 0 ? "Play a day and night to measure your typing." : ADVICE[skillAdvice(view)]}</p>` + // nothing measured: no praise (test pass 27/10)
      `<p class="td-profile-note">${measured >= 1 ? "Measured over " + profile.trend.stages + (profile.trend.stages === 1 ? " day and night." : " days and nights.") : profile.trend.stages === 0 ? "No data yet: these are defaults, refined after each day and night." : "Measured over " + profile.trend.stages + (profile.trend.stages === 1 ? " day and night" : " days and nights") + ", still blended with defaults."}</p>` +
      `<button class="vd-seal" type="button">Done <kbd>Esc</kbd></button>`;
    this.el.hidden = false;
  }

  close(): void {
    this.el.hidden = true;
  }

  /** A key while the card is open; true when it was the card's. */
  key(event: KeyboardEvent): boolean {
    if (event.code === "Escape" || event.code === "Enter" || event.code === "NumpadEnter") this.done();
    else if (!event.code.startsWith("Arrow")) return false;
    return true;
  }
}
