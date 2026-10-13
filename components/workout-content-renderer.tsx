"use client";

import React from "react";

export const CATEGORIAS_RM: Record<string, string[]> = {
  Fuerza: [
    "Back Squat",
    "Front Squat",
    "Deadlift",
    "Press Estricto",
    "Push Press",
  ],
  Weightlifting: [
    "Snatch",
    "Clean",
    "Clean & Jerk",
  ],
  Capacidades: [
    "Toes to Bar",
    "Pull Ups",
    "Chest to Bar",
    "Ring Muscle Up",
    "Bar Muscle Up",
    "Handstand Push Up",
    "DU",
    "Strict Hspu",
    "Strict Pull Ups",
    "Strict Chest to Bar",
    "Burpees",
    "Box Jump Over",
    "Rope Climb",
    "Legless Rope Climb",
    "Otro",
  ],
  Running: [
    "5km",
    "1k",
  ],
};

export const TODOS_LOS_EJERCICIOS = Object.values(CATEGORIAS_RM)
  .flat()
  .filter((e) => e !== "Otro");

export const EJERCICIOS_PARSER_SORTED = [...TODOS_LOS_EJERCICIOS].sort(
  (a, b) => b.length - a.length
);

export const isCapacidad = (ejercicio: string) => {
  if (!ejercicio) return false;
  return (
    CATEGORIAS_RM.Capacidades.includes(ejercicio) ||
    ejercicio.endsWith(" (Tiempo)") ||
    ejercicio.endsWith(" (Reps)")
  );
};

interface RmEntry {
  ejercicio: string;
  kg: number;
  unidad?: "kg" | "reps" | "segundos" | string;
}

interface WorkoutContentRendererProps {
  contenido: string;
  rms?: RmEntry[];
  previewMode?: boolean;
}

export function WorkoutContentRenderer({
  contenido,
  rms = [],
  previewMode = false,
}: WorkoutContentRendererProps) {
  if (!contenido || !contenido.trim()) {
    return (
      <p className="py-10 text-center text-sm italic text-muted-foreground">
        El día está vacío.
      </p>
    );
  }

  const cleanRMName = (name: string) => {
    return (name || "")
      .replace(/\[.*?\]\s*/, "")
      .replace(" (Tiempo)", "")
      .replace(" (Reps)", "");
  };

  const getRM = (exercise: string): number | null => {
    const allForExercise = rms.filter(
      (r) =>
        r.ejercicio === exercise ||
        cleanRMName(r.ejercicio) === exercise ||
        r.ejercicio?.toLowerCase() === exercise.toLowerCase() ||
        cleanRMName(r.ejercicio).toLowerCase() === exercise.toLowerCase()
    );
    if (allForExercise.length === 0) return null;
    const isTime =
      exercise === "5km" ||
      exercise === "1k" ||
      allForExercise[0].ejercicio?.includes(" (Tiempo)") ||
      allForExercise[0].unidad === "segundos";
    if (isTime) {
      return Math.min(...allForExercise.map((r) => Number(r.kg)));
    }
    return Math.max(...allForExercise.map((r) => Number(r.kg)));
  };

  const formatTime = (totalSeconds: number) => {
    const m = Math.floor(totalSeconds / 60);
    const s = Math.floor(totalSeconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const isExerciseCapacidad = (exerciseName: string) => {
    if (!exerciseName) return false;
    if (isCapacidad(exerciseName)) return true;
    return rms.some(
      (r) =>
        cleanRMName(r.ejercicio) === exerciseName &&
        (r.ejercicio.includes(" (Reps)") || r.unidad === "reps")
    );
  };

  const renderBoldItalic = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
        return (
          <strong key={i} className="font-bold text-foreground">
            {part.slice(2, -2)}
          </strong>
        );
      }
      const italicParts = part.split(/(\*.*?\*)/g);
      return italicParts.map((ip, j) => {
        if (ip.startsWith("*") && ip.endsWith("*") && ip.length > 2) {
          return (
            <em key={j} className="italic text-foreground/90">
              {ip.slice(1, -1)}
            </em>
          );
        }
        return ip;
      });
    });
  };

  const renderInlineMarkdown = (text: string) => {
    const parts = text.split(/(\[.*?\]\(.*?\))/g);
    return parts.map((part, i) => {
      const linkMatch = part.match(/\[(.*?)\]\((.*?)\)/);
      if (linkMatch) {
        const ytMatch = linkMatch[2].match(
          /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([^&?\n]+)/
        );
        const ytId = ytMatch ? ytMatch[1] : null;

        if (ytId && !previewMode) {
          return (
            <details
              key={i}
              className="group/video my-1 inline-block w-full max-w-sm"
            >
              <summary className="inline-flex cursor-pointer select-none list-none items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 font-medium text-primary transition-colors hover:bg-primary/20 hover:underline">
                {renderBoldItalic(linkMatch[1])}
                <svg
                  className="ml-0.5 h-4 w-4 opacity-70"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </summary>
              <div className="relative mt-2 mb-3 aspect-video overflow-hidden rounded-xl border border-border/50 bg-black shadow-lg">
                <iframe
                  src={`https://www.youtube.com/embed/${ytId}`}
                  title={linkMatch[1]}
                  allowFullScreen
                  className="h-full w-full border-0"
                />
              </div>
            </details>
          );
        }

        return (
          <a
            key={i}
            href={linkMatch[2]}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-1.5 py-0.5 font-medium text-primary transition-colors hover:bg-primary/20 hover:underline"
          >
            {renderBoldItalic(linkMatch[1])}
          </a>
        );
      }
      return <span key={i}>{renderBoldItalic(part)}</span>;
    });
  };

  const normalizeForSearch = (str: string) =>
    str
      .toLowerCase()
      .replace(/s\b/g, "")
      .replace(/[^a-z0-9 ]/g, "")
      .trim();

  // Extract custom exercises from student RMs
  const customExercises = (rms || [])
    .map((r) => r.ejercicio)
    .filter(
      (name) =>
        name && (name.includes(" (Tiempo)") || name.includes(" (Reps)"))
    )
    .map((name) => cleanRMName(name));

  // Merge and sort by length descending
  const allSearchExercises = Array.from(
    new Set([...customExercises, ...EJERCICIOS_PARSER_SORTED])
  ).sort((a, b) => b.length - a.length);

  // Parser State
  let activeRMContext: string | null = null;

  return (
    <div className="prose prose-invert prose-sm max-w-none">
      {contenido.split("\n").map((line: string, idx: number) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) {
          return <div key={idx} className="h-4" />;
        }

        const isDivider = /^---\s*$/.test(trimmedLine);
        const headerMatch = trimmedLine.match(
          /^(MOVILIDAD|ACTIVACIÓN|ACTIVACION|FUERZA|WARM\s+UP|WEIGHTLIFTING|COMPLEX|ACCESORIOS|BARBELL\s+CONDITIONING|WOD|METCON|AMRAP|EMOM|TABATA|FORTIME|FOR\s+TIME|STRENGTH|CARDIO)(?:\s*:|\s+-\s*|\s*$)/i
        );
        const isSectionHeader =
          !!headerMatch &&
          !trimmedLine.startsWith("-") &&
          !trimmedLine.startsWith("#");

        const searchLine = normalizeForSearch(line);

        // 1. Detect Context Shift (exact rules + common CrossFit abbreviations/aliases)
        if (
          searchLine.includes(normalizeForSearch("clean & jerk")) ||
          searchLine.includes(normalizeForSearch("clean and jerk")) ||
          searchLine.includes(normalizeForSearch("clean y jerk")) ||
          searchLine.includes(normalizeForSearch("c&j")) ||
          /\bcj\b/.test(searchLine)
        ) {
          activeRMContext = "Clean & Jerk";
        } else if (
          searchLine.includes(normalizeForSearch("jerk")) &&
          !searchLine.includes(normalizeForSearch("clean"))
        ) {
          activeRMContext = "Jerk";
        } else if (
          searchLine.includes(normalizeForSearch("clean")) &&
          !searchLine.includes(normalizeForSearch("jerk"))
        ) {
          activeRMContext = "Clean";
        } else if (
          searchLine.includes(normalizeForSearch("strict press")) ||
          searchLine.includes(normalizeForSearch("press estricto")) ||
          searchLine.includes(normalizeForSearch("shoulder press"))
        ) {
          activeRMContext = "Press Estricto";
        } else if (
          searchLine.includes(normalizeForSearch("push press")) ||
          searchLine.includes(normalizeForSearch("pushpress"))
        ) {
          activeRMContext = "Push Press";
        } else if (
          searchLine.includes(normalizeForSearch("back squat")) ||
          searchLine.includes(normalizeForSearch("backsquat")) ||
          searchLine.includes(normalizeForSearch("sentadilla trasera"))
        ) {
          activeRMContext = "Back Squat";
        } else if (
          searchLine.includes(normalizeForSearch("front squat")) ||
          searchLine.includes(normalizeForSearch("frontsquat")) ||
          searchLine.includes(normalizeForSearch("sentadilla frontal"))
        ) {
          activeRMContext = "Front Squat";
        } else if (
          searchLine.includes(normalizeForSearch("deadlift")) ||
          searchLine.includes(normalizeForSearch("dead lift")) ||
          searchLine.includes(normalizeForSearch("peso muerto"))
        ) {
          activeRMContext = "Deadlift";
        } else if (
          searchLine.includes(normalizeForSearch("ohs")) ||
          searchLine.includes(normalizeForSearch("over head squat")) ||
          searchLine.includes(normalizeForSearch("overhead squat")) ||
          searchLine.includes(normalizeForSearch("snatch"))
        ) {
          activeRMContext = "Snatch";
        } else if (/\b(t2b|ttb)\b/.test(searchLine)) {
          activeRMContext = "Toes to Bar";
        } else if (/\b(c2b|ctb)\b/.test(searchLine)) {
          activeRMContext = "Chest to Bar";
        } else if (/\brmu\b/.test(searchLine)) {
          activeRMContext = "Ring Muscle Up";
        } else if (/\bbmu\b/.test(searchLine)) {
          activeRMContext = "Bar Muscle Up";
        } else if (
          searchLine.includes(normalizeForSearch("strict hspu")) ||
          searchLine.includes(normalizeForSearch("shspu"))
        ) {
          activeRMContext = "Strict Hspu";
        } else if (/\bhspu\b/.test(searchLine)) {
          activeRMContext = "Handstand Push Up";
        } else {
          for (const ej of allSearchExercises) {
            if (searchLine.includes(normalizeForSearch(ej))) {
              activeRMContext = ej;
              break;
            }
          }
        }

        if (isDivider) {
          return <hr key={idx} className="my-6 border-t border-border/40" />;
        }

        if (isSectionHeader) {
          return (
            <h3
              key={idx}
              className="mt-8 mb-4 flex items-center gap-3 text-lg font-black uppercase italic text-primary first:mt-2"
            >
              <span className="h-5 w-1 rounded-full bg-primary shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
              {renderInlineMarkdown(trimmedLine)}
            </h3>
          );
        }

        // 2. Extract Block Formatting
        let lineContent = line;
        let isH1 = false;
        let isH2 = false;
        let isList = false;
        let isOldTitle = false;

        if (line.startsWith("# ")) {
          isH1 = true;
          lineContent = line.substring(2);
        } else if (line.startsWith("## ")) {
          isH2 = true;
          lineContent = line.substring(3);
        } else if (line.startsWith("- ")) {
          isList = true;
          lineContent = line.substring(2);
        } else if (
          line.startsWith("**") &&
          line.endsWith("**") &&
          line.length > 4 &&
          !line.includes(" ")
        ) {
          isOldTitle = true;
          lineContent = line.substring(2, line.length - 2);
        }

        // 3. Process Line & Inject Badges (when not in coach previewMode)
        let processedLine: React.ReactNode = renderInlineMarkdown(lineContent);
        const lowerLineContent = lineContent.toLowerCase();

        if (!previewMode) {
          const rangeRegexMatch = lineContent.match(
            /(\d+)%?\s*(?:a|al|-)\s+(\d+)%/i
          );
          const isInvalidRange = lineContent.match(
            /\b\d+x\s*\d+\s*-\s*\d+%/i
          );
          const rangeMatch = isInvalidRange ? null : rangeRegexMatch;
          const rpMatch = lineContent.match(
            /(\d+)\s*m\s*(?:rpe|rp)\s*(\d+)/i
          );

          if (rangeMatch && activeRMContext) {
            const percent1 = parseInt(rangeMatch[1], 10);
            const percent2 = parseInt(rangeMatch[2], 10);
            const maxRM = getRM(activeRMContext);
            if (maxRM) {
              const isTime =
                activeRMContext === "5km" ||
                activeRMContext === "1k" ||
                rms.some(
                  (r) =>
                    cleanRMName(r.ejercicio) === activeRMContext &&
                    (r.ejercicio.includes(" (Tiempo)") ||
                      r.unidad === "segundos")
                );
              const isCap = isExerciseCapacidad(activeRMContext);

              const calc = (p: number) =>
                isTime || isCap
                  ? Math.round((maxRM * p) / 100)
                  : Math.round(((maxRM * p) / 100) * 10) / 10;

              const formatValue = (val: number) => {
                if (isTime) return `${formatTime(val)} min`;
                return `${val}`;
              };

              const val1 = calc(percent1);
              const val2 = calc(percent2);

              const parts = lineContent.split(rangeMatch[0]);
              const beforeText = parts[0].replace(/\s*-\s*$/, " ");
              processedLine = (
                <span>
                  {renderInlineMarkdown(beforeText)}
                  <span className="mx-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                    {val1 === val2
                      ? `con ${formatValue(val1)} ${
                          isTime ? "" : isCap ? "reps" : "kg"
                        }`
                      : `con ${formatValue(val1)} a ${formatValue(val2)} ${
                          isTime ? "" : isCap ? "reps" : "kg"
                        }`}
                  </span>
                  {renderInlineMarkdown(parts[1] || "")}
                </span>
              );
            } else {
              const parts = lineContent.split(rangeMatch[0]);
              processedLine = (
                <span>
                  {renderInlineMarkdown(parts[0])}
                  {rangeMatch[0]}
                  <span className="mx-2 text-xs italic text-muted-foreground/60">
                    [ Sin RM de {activeRMContext} ]
                  </span>
                  {renderInlineMarkdown(parts[1] || "")}
                </span>
              );
            }
          } else if (lineContent.match(/([+-]?\d+)%/)) {
            const maxRM = activeRMContext ? getRM(activeRMContext) : null;
            const parts = lineContent.split(/([+-]?\d+%)/);

            processedLine = (
              <span>
                {parts.map((part, i) => {
                  if (/^[+-]?\d+%$/.test(part)) {
                    if (!activeRMContext) {
                      return <span key={i}>{part}</span>;
                    }

                    if (!maxRM) {
                      return (
                        <span key={i}>
                          {part}
                          <span className="mx-2 text-xs italic text-muted-foreground/60">
                            [ Sin RM de {activeRMContext} ]
                          </span>
                        </span>
                      );
                    }

                    const isModifier =
                      part.startsWith("+") || part.startsWith("-");
                    const percent = parseInt(part, 10);
                    const isTime =
                      activeRMContext === "5km" ||
                      activeRMContext === "1k" ||
                      rms.some(
                        (r) =>
                          cleanRMName(r.ejercicio) === activeRMContext &&
                          (r.ejercicio.includes(" (Tiempo)") ||
                            r.unidad === "segundos")
                      );
                    const isCap = isExerciseCapacidad(activeRMContext);

                    let calculatedWeight = 0;

                    if (isTime) {
                      let baseTime = maxRM;
                      const distMatch =
                        lineContent.match(/(?:x|\b)(\d+)\s*m\b/i) ||
                        lineContent.match(/\b(\d+)\s*m\b/i);
                      if (distMatch) {
                        const distanceMeters = parseInt(distMatch[1], 10);
                        const baseDist =
                          activeRMContext === "5km" ? 5000 : 1000;
                        baseTime = maxRM * (distanceMeters / baseDist);
                      }

                      if (isModifier) {
                        calculatedWeight = Math.round(
                          baseTime * (1 - percent / 100)
                        );
                      } else {
                        calculatedWeight = Math.round(
                          (baseTime * percent) / 100
                        );
                      }
                    } else {
                      calculatedWeight = isCap
                        ? Math.round((maxRM * percent) / 100)
                        : Math.round(((maxRM * percent) / 100) * 10) / 10;
                    }

                    const formatValue = (val: number) => {
                      if (isTime) return `${formatTime(val)} min`;
                      if (isCap) return `${val} reps`;
                      return `${val} kg`;
                    };

                    return (
                      <span
                        key={i}
                        className="mx-1 rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary"
                      >
                        {isTime
                          ? `[ Obj: ${formatValue(calculatedWeight)} ]`
                          : `con ${formatValue(calculatedWeight)}`}
                      </span>
                    );
                  } else {
                    let textToRender = part;
                    if (
                      i < parts.length - 1 &&
                      /^[+-]?\d+%$/.test(parts[i + 1])
                    ) {
                      textToRender = textToRender.replace(/\s*-\s*$/, " ");
                    }
                    return (
                      <span key={i}>{renderInlineMarkdown(textToRender)}</span>
                    );
                  }
                })}
              </span>
            );
          } else if (rpMatch) {
            const distanceMeters = parseInt(rpMatch[1], 10);
            const rpeValue = parseInt(rpMatch[2], 10);
            const rm1k = getRM("1k");
            const rm5k = getRM("5km");

            let baseTimeSeconds = 0;
            let baseDistance = 0;

            if (rm1k) {
              baseTimeSeconds = rm1k;
              baseDistance = 1000;
            } else if (rm5k) {
              baseTimeSeconds = rm5k;
              baseDistance = 5000;
            }

            if (baseTimeSeconds > 0 && rpeValue > 0 && rpeValue <= 10) {
              const basePacePerMeter = baseTimeSeconds / baseDistance;
              const baseTimeForTarget = distanceMeters * basePacePerMeter;
              const targetTime = baseTimeForTarget * (rpeValue / 10);

              const parts = lineContent.split(rpMatch[0]);
              processedLine = (
                <span>
                  {renderInlineMarkdown(parts[0])}
                  {rpMatch[0]}
                  <span className="mx-2 rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary shadow-sm">
                    [ Obj: {formatTime(targetTime)} min ]
                  </span>
                  {renderInlineMarkdown(parts[1] || "")}
                </span>
              );
            } else {
              const parts = lineContent.split(rpMatch[0]);
              processedLine = (
                <span>
                  {renderInlineMarkdown(parts[0])}
                  {rpMatch[0]}
                  <span className="mx-2 text-xs italic text-muted-foreground/60">
                    [ Sin RM para Predictor ]
                  </span>
                  {renderInlineMarkdown(parts[1] || "")}
                </span>
              );
            }
          } else if (lowerLineContent.includes("5km")) {
            const pb = getRM("5km");
            processedLine = (
              <span>
                {renderInlineMarkdown(lineContent)}{" "}
                <span className="ml-2 rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                  [ PB: {pb ? formatTime(pb) + " min" : "Sin RM"} ]
                </span>
              </span>
            );
          } else if (lowerLineContent.includes("1k")) {
            const pb = getRM("1k");
            processedLine = (
              <span>
                {renderInlineMarkdown(lineContent)}{" "}
                <span className="ml-2 rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                  [ PB: {pb ? formatTime(pb) + " min" : "Sin RM"} ]
                </span>
              </span>
            );
          }
        }

        // 4. Render Block Formatting
        if (isH1) {
          return (
            <h3
              key={idx}
              className="mt-8 mb-4 flex items-center gap-3 text-2xl font-black uppercase italic text-primary"
            >
              <span className="h-8 w-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(249,115,22,0.5)]" />
              {processedLine}
            </h3>
          );
        }
        if (isH2) {
          return (
            <h4
              key={idx}
              className="mt-6 mb-2 flex items-center gap-2 text-lg font-bold text-foreground"
            >
              <span className="h-5 w-1 rounded-full bg-primary/60" />
              {processedLine}
            </h4>
          );
        }
        if (isList) {
          return (
            <div
              key={idx}
              className="group my-2 flex items-start gap-3 pl-4"
            >
              <div className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/60 transition-colors group-hover:bg-primary" />
              <div className="m-0 flex-1 leading-snug text-foreground/90">
                {processedLine}
              </div>
            </div>
          );
        }
        if (isOldTitle) {
          return (
            <h4
              key={idx}
              className="mt-8 mb-3 flex items-center gap-3 text-lg font-black uppercase italic text-primary first:mt-0"
            >
              <span className="h-6 w-1 rounded-full bg-primary" />
              {processedLine}
            </h4>
          );
        }

        return (
          <div key={idx} className="my-1 leading-relaxed text-foreground/80">
            {processedLine}
          </div>
        );
      })}
    </div>
  );
}
