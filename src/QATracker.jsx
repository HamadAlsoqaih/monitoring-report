import { useState, useRef, useEffect } from "react";

const STORAGE_KEY = "qa-tracker-state";

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { mainCount: 0, branches: [] };
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function CounterBtn({ value, onChange, size = "md" }) {
  const sz = size === "sm"
    ? { btn: "w-8 h-8 text-lg", val: "text-lg min-w-[2.5rem]" }
    : { btn: "w-11 h-11 text-2xl", val: "text-3xl min-w-[3rem] font-semibold" };
  return (
    <div className="flex items-center gap-1">
      <button onClick={() => onChange(Math.max(0, value - 1))} className={`${sz.btn} rounded-lg bg-zinc-700 active:bg-zinc-600 text-zinc-200 flex items-center justify-center select-none touch-manipulation`}>−</button>
      <span className={`${sz.val} text-center text-white tabular-nums`}>{value}</span>
      <button onClick={() => onChange(value + 1)} className={`${sz.btn} rounded-lg bg-zinc-700 active:bg-zinc-600 text-zinc-200 flex items-center justify-center select-none touch-manipulation`}>+</button>
    </div>
  );
}

function NoteCard({ note, onUpdate, onDelete }) {
  const [orderInput, setOrderInput] = useState("");
  const [showTime, setShowTime] = useState(false);
  const [hours, setHours] = useState("");
  const [minutes, setMinutes] = useState("");
  const [ampm, setAmpm] = useState("AM");

  const addOrder = () => {
    const trimmed = orderInput.trim();
    if (!trimmed) return;
    let time = null;
    if (showTime && hours.trim()) {
      time = `${hours.trim()}:${(minutes.trim() || "00").padStart(2, "0")} ${ampm}`;
    }
    onUpdate({ ...note, orders: [...note.orders, { num: trimmed, time }] });
    setOrderInput("");
    setHours("");
    setMinutes("");
  };

  const removeOrder = (idx) => {
    onUpdate({ ...note, orders: note.orders.filter((_, i) => i !== idx) });
  };

  const normalizedOrders = note.orders.map((o) => typeof o === "string" ? { num: o, time: null } : o);

  return (
    <div className={`rounded-xl p-3 space-y-2 border-l-4 ${note.critical ? "bg-red-950/40 border-red-500" : "bg-zinc-800 border-transparent"}`}>
      <div className="flex items-start justify-between gap-2">
        <button onClick={() => onUpdate({ ...note, critical: !note.critical })} className={`text-xs font-bold px-2 py-0.5 rounded-md touch-manipulation shrink-0 ${note.critical ? "bg-red-600 text-white" : "bg-zinc-700 text-zinc-400"}`}>{note.critical ? "CRIT" : "REG"}</button>
        <input
          value={note.text}
          onChange={(e) => onUpdate({ ...note, text: e.target.value })}
          placeholder="Issue description..."
          className="flex-1 bg-transparent text-zinc-100 text-sm border-b border-zinc-600 focus:border-amber-400 outline-none pb-1 min-w-0"
        />
        <button onClick={onDelete} className="text-zinc-500 active:text-red-400 text-xs px-1.5 py-0.5 touch-manipulation">✕</button>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-zinc-400 text-xs tracking-wide uppercase">Occurrences</span>
        <CounterBtn value={note.count} onChange={(v) => onUpdate({ ...note, count: v })} size="sm" />
      </div>

      <div>
        <div className="flex gap-1.5 items-center">
          <input
            value={orderInput}
            onChange={(e) => setOrderInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addOrder()}
            placeholder="Order #"
            className="flex-1 bg-zinc-700 text-zinc-100 text-sm rounded-lg px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-amber-400 min-w-0"
            inputMode="text"
          />
          <button onClick={() => setShowTime(!showTime)} className={`text-sm rounded-lg px-2 py-1.5 touch-manipulation shrink-0 ${showTime ? "bg-blue-600 text-white" : "bg-zinc-700 text-zinc-400"}`}>🕐</button>
          <button onClick={addOrder} className="bg-amber-500 active:bg-amber-600 text-zinc-900 font-semibold text-sm rounded-lg px-3 py-1.5 touch-manipulation">Add</button>
        </div>
        {showTime && (
          <div className="flex items-center gap-1.5 mt-1.5">
            <input
              value={hours}
              onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 2); if (v === "" || (Number(v) >= 0 && Number(v) <= 12)) setHours(v); }}
              placeholder="HH"
              inputMode="numeric"
              className="w-12 h-10 bg-zinc-700 text-zinc-100 text-center text-sm font-mono rounded-lg outline-none focus:ring-1 focus:ring-blue-400"
            />
            <span className="text-zinc-400 font-bold text-lg">:</span>
            <input
              value={minutes}
              onChange={(e) => { const v = e.target.value.replace(/\D/g, "").slice(0, 2); if (v === "" || (Number(v) >= 0 && Number(v) <= 59)) setMinutes(v); }}
              placeholder="MM"
              inputMode="numeric"
              className="w-12 h-10 bg-zinc-700 text-zinc-100 text-center text-sm font-mono rounded-lg outline-none focus:ring-1 focus:ring-blue-400"
            />
            <button onClick={() => setAmpm("AM")} className={`h-10 px-3 rounded-lg text-xs font-bold touch-manipulation ${ampm === "AM" ? "bg-blue-600 text-white" : "bg-zinc-700 text-zinc-400"}`}>AM</button>
            <button onClick={() => setAmpm("PM")} className={`h-10 px-3 rounded-lg text-xs font-bold touch-manipulation ${ampm === "PM" ? "bg-blue-600 text-white" : "bg-zinc-700 text-zinc-400"}`}>PM</button>
          </div>
        )}
        {normalizedOrders.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {normalizedOrders.map((o, i) => (
              <span key={i} onClick={() => removeOrder(i)} className="bg-zinc-700 text-zinc-300 text-xs rounded-md px-2 py-1 flex items-center gap-1 cursor-pointer active:bg-red-900/40">
                #{o.num}{o.time ? ` at ${o.time}` : ""} <span className="text-zinc-500">✕</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const NUKE_STEPS = [
  { label: "🧹", bg: "bg-zinc-700", text: "text-zinc-300" },
  { label: "⚠️", bg: "bg-amber-600", text: "text-white" },
  { label: "💀", bg: "bg-red-600 animate-pulse", text: "text-white" },
];

function Branch({ branch, onUpdate, onDelete }) {
  const [open, setOpen] = useState(true);
  const [noteName, setNoteName] = useState("");
  const [nukeStep, setNukeStep] = useState(0);
  const nukeTimer = useRef(null);
  const [deleteStep, setDeleteStep] = useState(0);
  const deleteTimer = useRef(null);

  const handleDelete = () => {
    if (deleteStep < 2) {
      setDeleteStep(deleteStep + 1);
      clearTimeout(deleteTimer.current);
      deleteTimer.current = setTimeout(() => setDeleteStep(0), 2500);
    } else {
      onDelete();
      clearTimeout(deleteTimer.current);
    }
  };

  const handleNuke = () => {
    if (nukeStep < 2) {
      setNukeStep(nukeStep + 1);
      clearTimeout(nukeTimer.current);
      nukeTimer.current = setTimeout(() => setNukeStep(0), 2500);
    } else {
      onUpdate({ ...branch, notes: [] });
      setNukeStep(0);
      clearTimeout(nukeTimer.current);
    }
  };

  const addNote = () => {
    const trimmed = noteName.trim();
    if (!trimmed) return;
    onUpdate({
      ...branch,
      notes: [...branch.notes, { id: genId(), text: trimmed, count: 1, orders: [], critical: false }],
    });
    setNoteName("");
  };

  const updateNote = (updated) => {
    onUpdate({ ...branch, notes: branch.notes.map((n) => (n.id === updated.id ? updated : n)) });
  };

  const deleteNote = (id) => {
    onUpdate({ ...branch, notes: branch.notes.filter((n) => n.id !== id) });
  };

  const totalIssues = branch.notes.reduce((s, n) => s + n.count, 0);

  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-700/60">
      <div className="flex items-center gap-2 px-3 py-2.5 bg-zinc-800/80">
        <button onClick={() => setOpen(!open)} className="text-zinc-400 text-sm w-6 touch-manipulation">{open ? "▾" : "▸"}</button>
        <input
          value={branch.name}
          onChange={(e) => onUpdate({ ...branch, name: e.target.value })}
          className="flex-1 bg-transparent text-zinc-100 font-semibold outline-none min-w-0 text-base"
          placeholder="Branch name..."
        />
        <div className="flex items-center gap-2">
          <CounterBtn value={branch.count} onChange={(v) => onUpdate({ ...branch, count: v })} size="sm" />
          <button onClick={handleNuke} className={`${NUKE_STEPS[nukeStep].bg} ${NUKE_STEPS[nukeStep].text} text-sm rounded-lg w-8 h-8 flex items-center justify-center touch-manipulation transition-all`}>{NUKE_STEPS[nukeStep].label}</button>
          <button onClick={handleDelete} className={`text-xs font-medium rounded-lg px-2 h-8 flex items-center justify-center touch-manipulation transition-all ${deleteStep === 0 ? "text-zinc-500 bg-transparent" : deleteStep === 1 ? "bg-amber-600 text-white" : "bg-red-600 text-white animate-pulse"}`}>{deleteStep === 0 ? "✕" : deleteStep === 1 ? "Sure?" : "DELETE"}</button>
        </div>
      </div>

      {open && (
        <div className="p-3 space-y-2.5">
          {branch.notes.length > 0 && (
            <div className="text-xs text-zinc-500 px-1">{branch.notes.length} note{branch.notes.length !== 1 ? "s" : ""} · {totalIssues} total issue{totalIssues !== 1 ? "s" : ""}</div>
          )}

          {branch.notes.map((note) => (
            <NoteCard key={note.id} note={note} onUpdate={updateNote} onDelete={() => deleteNote(note.id)} />
          ))}

          <div className="flex gap-1.5">
            <input
              value={noteName}
              onChange={(e) => setNoteName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addNote()}
              placeholder="New note..."
              className="flex-1 bg-zinc-800 text-zinc-200 text-sm rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-amber-400 min-w-0"
            />
            <button onClick={addNote} className="bg-zinc-700 active:bg-zinc-600 text-zinc-200 text-sm font-medium rounded-lg px-3 py-2 touch-manipulation">+ Note</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ExportModal({ state, onClose }) {
  const textRef = useRef(null);

  const fmtOrders = (orders) => orders.map((o) => {
    const entry = typeof o === "string" ? { num: o, time: null } : o;
    return `#${entry.num}${entry.time ? ` at ${entry.time}` : ""}`;
  }).join(", ");

  const generateReport = () => {
    let lines = [`QA Review Report`, `Orders Reviewed: ${state.mainCount}`, `---`];
    state.branches.forEach((b) => {
      lines.push(`\n## ${b.name || "Unnamed Branch"} (Counter: ${b.count})`);
      if (b.notes.length === 0) {
        lines.push("  No notes.");
        return;
      }
      const critical = b.notes.filter((n) => n.critical);
      const regular = b.notes.filter((n) => !n.critical);
      if (critical.length > 0) {
        lines.push(`  🚨 CRITICAL:`);
        critical.forEach((n) => {
          lines.push(`    - ${n.text || "Unnamed"} × ${n.count}`);
          if (n.orders.length > 0) lines.push(`      Orders: ${fmtOrders(n.orders)}`);
        });
      }
      if (regular.length > 0) {
        if (critical.length > 0) lines.push(`  Regular:`);
        regular.forEach((n) => {
          lines.push(`    - ${n.text || "Unnamed"} × ${n.count}`);
          if (n.orders.length > 0) lines.push(`      Orders: ${fmtOrders(n.orders)}`);
        });
      }
    });
    return lines.join("\n");
  };

  const report = generateReport();

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(report);
    } catch {
      textRef.current?.select();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col" onClick={onClose}>
      <div className="flex-1 flex flex-col w-full p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h2 className="text-white font-semibold text-lg">Export Report</h2>
          <button onClick={onClose} className="text-zinc-400 text-2xl w-10 h-10 flex items-center justify-center touch-manipulation">✕</button>
        </div>
        <textarea ref={textRef} readOnly value={report} className="flex-1 bg-zinc-800 text-zinc-200 text-sm leading-relaxed rounded-xl p-4 outline-none resize-none font-mono" />
        <button onClick={copy} className="w-full bg-amber-500 active:bg-amber-600 text-zinc-900 font-semibold rounded-xl py-3 touch-manipulation">Copy to Clipboard</button>
      </div>
    </div>
  );
}

export default function QATracker() {
  const [state, setState] = useState(loadState);
  const [branchName, setBranchName] = useState("");
  const [showExport, setShowExport] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Persist to localStorage on every state change
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const updateState = (updates) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const addBranch = () => {
    const trimmed = branchName.trim();
    if (!trimmed) return;
    setState((prev) => ({
      ...prev,
      branches: [...prev.branches, { id: genId(), name: trimmed, count: 0, notes: [] }],
    }));
    setBranchName("");
  };

  const updateBranch = (updated) => {
    setState((prev) => ({ ...prev, branches: prev.branches.map((b) => (b.id === updated.id ? updated : b)) }));
  };

  const deleteBranch = (id) => {
    setState((prev) => ({ ...prev, branches: prev.branches.filter((b) => b.id !== id) }));
  };

  const resetAll = () => {
    if (confirmReset) {
      setState({ mainCount: 0, branches: [] });
      setConfirmReset(false);
    } else {
      setConfirmReset(true);
      setTimeout(() => setConfirmReset(false), 3000);
    }
  };

  const totalNotes = state.branches.reduce((s, b) => s + b.notes.length, 0);
  const totalIssues = state.branches.reduce((s, b) => s + b.notes.reduce((ns, n) => ns + n.count, 0), 0);

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20" style={{ WebkitTapHighlightColor: "transparent" }}>
      <div className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-bold tracking-tight text-zinc-100">QA Tracker</h1>
          <div className="flex gap-2">
            <button onClick={() => setShowExport(true)} className="bg-zinc-800 active:bg-zinc-700 text-zinc-300 text-xs font-medium rounded-lg px-3 py-1.5 touch-manipulation">Export</button>
            <button onClick={resetAll} className={`${confirmReset ? "bg-red-600 active:bg-red-700 text-white" : "bg-zinc-800 active:bg-zinc-700 text-zinc-300"} text-xs font-medium rounded-lg px-3 py-1.5 touch-manipulation`}>
              {confirmReset ? "Confirm?" : "Reset"}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-zinc-500 uppercase tracking-widest">Orders Reviewed</div>
            <div className="text-xs text-zinc-600 mt-0.5">{state.branches.length} branch{state.branches.length !== 1 ? "es" : ""} · {totalNotes} note{totalNotes !== 1 ? "s" : ""} · {totalIssues} issue{totalIssues !== 1 ? "s" : ""}</div>
          </div>
          <CounterBtn value={state.mainCount} onChange={(v) => updateState({ mainCount: v })} />
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {state.branches.map((branch) => (
          <Branch key={branch.id} branch={branch} onUpdate={updateBranch} onDelete={() => deleteBranch(branch.id)} />
        ))}

        <div className="flex gap-1.5">
          <input
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addBranch()}
            placeholder="New branch name..."
            className="flex-1 bg-zinc-900 text-zinc-200 rounded-xl px-4 py-3 outline-none border border-zinc-700/60 focus:border-amber-400 min-w-0"
          />
          <button onClick={addBranch} className="bg-amber-500 active:bg-amber-600 text-zinc-900 font-semibold rounded-xl px-4 py-3 touch-manipulation whitespace-nowrap">+ Branch</button>
        </div>
      </div>

      {showExport && <ExportModal state={state} onClose={() => setShowExport(false)} />}
    </div>
  );
}
