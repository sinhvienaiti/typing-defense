/**
 * "Hồ sơ gõ" (docs/games/BALANCE.md §2): the card the title opens to show the player how they type, from the
 * profile kept under typing-defense.skill: speed, accuracy, the time to start a new word, evenness, one short
 * advice line (the kit's skillAdvice), and the pace the next run will take. Until enough has been measured the
 * numbers lean on the mode's defaults, and the card says so. Keyboard first: Enter or Esc closes.
 */
import { ADVICE_VI, blendSkill, skillAdvice, type SkillProfile } from "../kit/balance";

const fixed = (value: number, digits: number): string => value.toFixed(digits).replace(".", ",");

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
      `<h3>Hồ sơ gõ</h3><dl>` +
      row("Tốc độ", Math.round(view.e) + " WPM") +
      row("Độ chính xác", Math.round(view.a * 100) + " %") +
      row("Nhận từ mới", fixed(view.recognize.new, 1) + " s") +
      row("Độ đều", Math.round(Math.max(0, 1 - view.cv) * 100) + " %") +
      row("Nhịp ván tới", k === null ? "Tắt" : "×" + fixed(k, 2), k === null ? "tự điều đang tắt" : k > 1.005 ? "nhanh hơn chuẩn" : k < 0.995 ? "chậm hơn chuẩn" : "chuẩn") +
      `</dl><p class="td-profile-advice">${ADVICE_VI[skillAdvice(view)]}</p>` +
      `<p class="td-profile-note">${measured >= 1 ? "Đã đo " + profile.trend.stages + " ngày đêm." : profile.trend.stages === 0 ? "Chưa đo: số trên là mức mặc định, sẽ đúng dần sau mỗi ngày đêm." : "Đã đo " + profile.trend.stages + " ngày đêm: còn trộn với mức mặc định."}</p>` +
      `<button class="vd-seal" type="button">Xong <kbd>Esc</kbd></button>`;
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
