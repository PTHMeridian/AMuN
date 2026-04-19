"use client";

import { useState } from "react";
import scenario from "@/data/active/current.json";

type Choice = {
  id: string;
  text: string;
  leads_to: string;
};

type Node = {
  prompt: string;
  choices: Choice[];
};

type Scenario = {
  id: string;
  scenario: string;
  category: string;
  opening: Node;
  nodes: Record<string, Node>;
  aggregate: Record<string, number>;
};

const data = scenario as Scenario;

export default function ConsequenceMapper() {
  const [depth, setDepth] = useState(0);
  const [path, setPath] = useState<string[]>([]);
  const [pathKeys, setPathKeys] = useState<string[]>([]);
  const [currentNode, setCurrentNode] = useState<Node>(data.opening);
  const [revealed, setRevealed] = useState(false);
  const [readyToReveal, setReadyToReveal] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const maxDepth = 4;

  function handleChoice(choice: Choice) {
    if (selectedId) return;
    setSelectedId(choice.id);
    setPath((prev) => [...prev, choice.text]);
    setPathKeys((prev) => [...prev, choice.id]);

    setTimeout(() => {
      const nextDepth = depth + 1;
      setDepth(nextDepth);
      setSelectedId(null);

      if (nextDepth >= maxDepth - 1 || !data.nodes[choice.leads_to]) {
        setReadyToReveal(true);
        return;
      }

      setCurrentNode(data.nodes[choice.leads_to]);
    }, 400);
  }

  async function handleComplete() {
    setSubmitting(true);
    try {
      await fetch("/api/record", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scenarioId: data.id,
          path: pathKeys,
          firstChoice: pathKeys[0],
        }),
      });
    } catch {
      // silent fail — never block the user experience
    }
    setDepth(maxDepth);
    setRevealed(true);
    setSubmitting(false);
  }

  function handleReset() {
    setDepth(0);
    setPath([]);
    setPathKeys([]);
    setCurrentNode(data.opening);
    setRevealed(false);
    setReadyToReveal(false);
    setSelectedId(null);
    setSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <ScenarioCard text={data.scenario} category={data.category} />
      <DepthBar
        depth={depth}
        max={maxDepth}
        revealed={revealed}
        readyToReveal={readyToReveal}
      />
      {path.length > 0 && <ConsequenceTree path={path} />}
      {!readyToReveal && !revealed && (
        <ChoiceList
          node={currentNode}
          selectedId={selectedId}
          onChoose={handleChoice}
        />
      )}
      {readyToReveal && !revealed && (
        <CompleteButton
          onComplete={handleComplete}
          submitting={submitting}
        />
      )}
      {revealed && (
        <Reveal
          aggregate={data.aggregate}
          onReset={handleReset}
        />
      )}
    </div>
  );
}

function ScenarioCard({
  text,
  category,
}: {
  text: string;
  category: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
      <p className="text-xs text-zinc-400 uppercase tracking-widest mb-3">
        {category}
      </p>
      <p className="text-lg font-medium text-zinc-900 dark:text-zinc-50 leading-relaxed">
        {text}
      </p>
    </div>
  );
}

function DepthBar({
  depth,
  max,
  revealed,
  readyToReveal,
}: {
  depth: number;
  max: number;
  revealed: boolean;
  readyToReveal: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
            revealed
              ? "bg-emerald-500"
              : readyToReveal && i < max - 1
              ? "bg-emerald-500"
              : i < depth
              ? "bg-violet-500"
              : "bg-zinc-200 dark:bg-zinc-800"
          }`}
        />
      ))}
      <span
        className={`text-xs ml-1 whitespace-nowrap transition-colors duration-300 ${
          revealed
            ? "text-emerald-500"
            : readyToReveal
            ? "text-emerald-500"
            : "text-zinc-400"
        }`}
      >
        {revealed
          ? "complete"
          : readyToReveal
          ? "ready"
          : `level ${depth + 1}`}
      </span>
    </div>
  );
}

function ConsequenceTree({ path }: { path: string[] }) {
  return (
    <div className="space-y-2">
      {path.map((step, i) => (
        <div
          key={i}
          className="flex items-center gap-2"
          style={{ paddingLeft: `${i * 16}px` }}
        >
          {i > 0 && (
            <div className="w-4 h-px bg-zinc-300 dark:bg-zinc-700 flex-shrink-0" />
          )}
          <span className="text-sm text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950 border border-violet-200 dark:border-violet-800 rounded-full px-3 py-1">
            {step}
          </span>
        </div>
      ))}
    </div>
  );
}

function ChoiceList({
  node,
  selectedId,
  onChoose,
}: {
  node: Node;
  selectedId: string | null;
  onChoose: (choice: Choice) => void;
}) {
  return (
    <div className="space-y-3">
      {node.choices.map((choice) => (
        <button
          key={choice.id}
          onClick={() => onChoose(choice)}
          disabled={!!selectedId}
          className={`w-full text-left rounded-xl border px-4 py-3.5 text-sm leading-relaxed transition-all duration-200 ${
            selectedId === choice.id
              ? "border-violet-400 bg-violet-50 dark:bg-violet-950 text-violet-800 dark:text-violet-200"
              : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400 dark:hover:border-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800"
          }`}
        >
          <span className="flex items-center gap-3">
            <span
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 border transition-all ${
                selectedId === choice.id
                  ? "bg-violet-500 border-violet-500"
                  : "border-zinc-300 dark:border-zinc-600"
              }`}
            />
            {choice.text}
          </span>
        </button>
      ))}
    </div>
  );
}

function CompleteButton({
  onComplete,
  submitting,
}: {
  onComplete: () => void;
  submitting: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center">
        You have mapped your consequence path.
      </p>
      <button
        onClick={onComplete}
        disabled={submitting}
        className="w-full rounded-xl border border-emerald-400 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950 px-4 py-4 text-sm font-medium text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-all duration-200 disabled:opacity-50"
      >
        {submitting ? "Submitting..." : "Complete — see how others navigated this"}
      </button>
    </div>
  );
}

function Reveal({
  aggregate,
  onReset,
}: {
  aggregate: Record<string, number>;
  onReset: () => void;
}) {
  const total = Object.values(aggregate).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
        <p className="text-xs text-zinc-400 uppercase tracking-widest mb-4">
          How others navigated this
        </p>
        <div className="space-y-3">
          {Object.entries(aggregate).map(([key, count]) => {
            const pct = Math.round((count / total) * 100);
            return (
              <div key={key}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-zinc-600 dark:text-zinc-400 capitalize">
                    {key.replace(/-/g, " ")}
                  </span>
                  <span className="text-zinc-500">{pct}%</span>
                </div>
                <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-700"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-zinc-400 mt-4 italic">
          Aggregate only — no personal data collected
        </p>
      </div>
      <button
        onClick={onReset}
        className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
      >
        Try a different path
      </button>
    </div>
  );
}