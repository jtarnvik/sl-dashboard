import humanizeDuration from "humanize-duration";

export const shortSwedishHumanizer = humanizeDuration.humanizer({
  units: ["h", "m", "s"],
  round: true,
  spacer: "",
  language: "shortSv",
  languages: {
    shortSv: {
      y: () => "år",
      mo: () => "mån",
      w: () => "v",
      d: () => "d",
      h: () => "h",
      m: () => "m",
      s: () => "s",
      ms: () => "ms",
    },
  },
});