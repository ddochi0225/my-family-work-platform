import type { ReactNode } from "react";

type Props = {
  dateLabel?: string;
  title: string;
  description: string;
  tone?: "home" | "todo" | "schedule" | "timetable" | "goals" | "allowance";
  rightSlot?: ReactNode;
};

const toneMap = {
  home: "from-sky-50 via-indigo-50 to-violet-50 border-sky-100",
  todo: "from-cyan-50 via-sky-50 to-emerald-50 border-cyan-100",
  schedule: "from-blue-50 via-indigo-50 to-violet-50 border-blue-100",
  timetable: "from-violet-50 via-fuchsia-50 to-pink-50 border-violet-100",
  goals: "from-violet-50 via-indigo-50 to-sky-50 border-violet-100",
  allowance: "from-indigo-50 via-violet-50 to-sky-50 border-violet-100",
};

export default function ChildPageHeader({
  dateLabel,
  title,
  description,
  tone = "home",
  rightSlot,
}: Props) {
  return (
    <section
      className={`rounded-[28px] border bg-gradient-to-r px-6 py-5 shadow-sm ${toneMap[tone]}`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          {dateLabel ? (
            <p className="text-xs font-semibold tracking-wide text-sky-700">{dateLabel}</p>
          ) : null}
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
          <p className="mt-2 text-sm text-slate-600">{description}</p>
        </div>

        {rightSlot ? <div className="flex flex-wrap gap-2">{rightSlot}</div> : null}
      </div>
    </section>
  );
}
