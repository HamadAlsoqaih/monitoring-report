import { useState, useRef, useEffect, useCallback } from "react";

const SK = "qa-tracker-state";
function load() { try { const s = localStorage.getItem(SK); if (s) return JSON.parse(s); } catch {} return { mainCount: 0, branches: [] }; }
function gid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

function Grow({ value, onChange, onKeyDown, placeholder, className, inputMode }) {
  const ref = useRef(null);
  const resize = useCallback(() => { if (ref.current) { ref.current.style.height = "0"; ref.current.style.height = ref.current.scrollHeight + "px"; } }, []);
  useEffect(resize, [value, resize]);
  return <textarea ref={ref} value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder} className={className + " resize-none overflow-hidden"} inputMode={inputMode} rows={1} />;
}

function Ctr({ value, onChange, size = "md" }) {
  const s = size === "sm" ? "w-7 h-7 text-base" : "w-10 h-10 text-xl";
  const v = size === "sm" ? "text-base min-w-[1.8rem]" : "text-2xl min-w-[2.5rem] font-semibold";
  return (
    <div className="flex items-center gap-0.5">
      <button onClick={e => { e.stopPropagation(); onChange(Math.max(0, value - 1)); }} className={`${s} rounded-md bg-zinc-700 active:bg-zinc-600 text-zinc-200 flex items-center justify-center select-none touch-manipulation`}>−</button>
      <span className={`${v} text-center text-white tabular-nums`}>{value}</span>
      <button onClick={e => { e.stopPropagation(); onChange(value + 1); }} className={`${s} rounded-md bg-zinc-700 active:bg-zinc-600 text-zinc-200 flex items-center justify-center select-none touch-manipulation`}>+</button>
    </div>
  );
}

function Trip({ labels, onConfirm, timeout = 2500 }) {
  const [step, setStep] = useState(0);
  const t = useRef(null);
  const go = (e) => {
    e.stopPropagation();
    if (step < 2) { setStep(step + 1); clearTimeout(t.current); t.current = setTimeout(() => setStep(0), timeout); }
    else { onConfirm(); setStep(0); clearTimeout(t.current); }
  };
  const c = ["bg-zinc-700 text-zinc-400", "bg-amber-600 text-white", "bg-red-600 text-white animate-pulse"];
  return <button onClick={go} className={`${c[step]} text-xs font-medium rounded-md px-2 py-1 touch-manipulation transition-all`}>{labels[step]}</button>;
}

export default function QATracker() {
  const [state, setState] = useState(load);
  const [activeId, setActiveId] = useState(null);
  const [branchName, setBranchName] = useState("");
  const [noteName, setNoteName] = useState("");
  const [orderInputs, setOrderInputs] = useState({});
  const [timeState, setTimeState] = useState({});
  const [showExport, setShowExport] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const exportRef = useRef(null);

  useEffect(() => { try { localStorage.setItem(SK, JSON.stringify(state)); } catch {} }, [state]);

  const branch = activeId ? state.branches.find(b => b.id === activeId) : null;

  const addBranch = () => {
    const t = branchName.trim(); if (!t) return;
    const id = gid();
    setState(p => ({ ...p, branches: [...p.branches, { id, name: t, count: 0, notes: [] }] }));
    setBranchName("");
    setActiveId(id);
  };

  const delBranch = (id) => {
    setState(p => ({ ...p, branches: p.branches.filter(b => b.id !== id) }));
    if (activeId === id) setActiveId(null);
  };

  const updateBranch = (updated) => setState(p => ({ ...p, branches: p.branches.map(b => b.id === updated.id ? updated : b) }));

  // Note actions
  const SEVERITY = [
    { key: "none", label: "OK", bg: "bg-green-700", text: "text-white", border: "border-green-600", card: "bg-zinc-900" },
    { key: "normal", label: "ISSUE", bg: "bg-amber-600", text: "text-white", border: "border-amber-500", card: "bg-amber-950/30" },
    { key: "critical", label: "CRIT", bg: "bg-red-600", text: "text-white", border: "border-red-500", card: "bg-red-950/40" },
  ];
  const getSev = (note) => {
    if (note.severity) return SEVERITY.findIndex(s => s.key === note.severity) || 0;
    if (note.critical) return 2;
    return 0;
  };
  const cycleSev = (note) => {
    const next = (getSev(note) + 1) % 3;
    updateNote({ ...note, severity: SEVERITY[next].key });
  };

  const addNote = () => {
    if (!branch) return;
    const t = noteName.trim(); if (!t) return;
    updateBranch({ ...branch, count: branch.count + 1, notes: [...branch.notes, { id: gid(), text: t, count: 1, orders: [], severity: "none" }] });
    setNoteName("");
  };

  const updateNote = (note, countDelta = 0) => {
    if (!branch) return;
    updateBranch({ ...branch, count: branch.count + countDelta, notes: branch.notes.map(n => n.id === note.id ? note : n) });
  };

  const deleteNote = (id) => {
    if (!branch) return;
    const note = branch.notes.find(n => n.id === id);
    updateBranch({ ...branch, count: Math.max(0, branch.count - note.count), notes: branch.notes.filter(n => n.id !== id) });
  };

  const nukeNotes = () => { if (branch) updateBranch({ ...branch, count: 0, notes: [] }); };

  const setNoteCount = (note, v) => { const d = v - note.count; updateNote({ ...note, count: v }, d); };

  const getOI = (id) => orderInputs[id] || "";
  const setOI = (id, v) => setOrderInputs(p => ({ ...p, [id]: v }));
  const getT = (id) => timeState[id] || { show: false, h: "", m: "", ap: "AM" };
  const setT = (id, u) => setTimeState(p => ({ ...p, [id]: { ...getT(id), ...u } }));

  const addOrder = (note) => {
    const v = getOI(note.id).trim(); if (!v) return;
    const tm = getT(note.id);
    let time = null;
    if (tm.show && tm.h.trim()) time = `${tm.h.trim()}:${(tm.m.trim() || "00").padStart(2, "0")} ${tm.ap}`;
    updateNote({ ...note, orders: [...note.orders, { num: v, time }] });
    setOI(note.id, "");
    setT(note.id, { h: "", m: "" });
  };

  const removeOrder = (note, idx) => updateNote({ ...note, orders: note.orders.filter((_, i) => i !== idx) });

  // Export
  const fmtO = (orders) => orders.map(o => { const e = typeof o === "string" ? { num: o, time: null } : o; return `#${e.num}${e.time ? ` at ${e.time}` : ""}`; }).join(", ");
  const report = () => {
    let l = [`QA Review Report`, `Orders Reviewed: ${state.mainCount}`, `---`];
    state.branches.forEach(b => {
      l.push(`\n## ${b.name} (${b.count} reviews)`);
      if (!b.notes.length) { l.push("  No notes."); return; }
      const crit = b.notes.filter(n => getSev(n) === 2);
      const normal = b.notes.filter(n => getSev(n) === 1);
      const ok = b.notes.filter(n => getSev(n) === 0);
      if (crit.length) { l.push(`  🚨 CRITICAL:`); crit.forEach(n => { l.push(`    - ${n.text} × ${n.count}`); if (n.orders.length) l.push(`      Orders: ${fmtO(n.orders)}`); }); }
      if (normal.length) { l.push(`  ⚠️ NORMAL ISSUES:`); normal.forEach(n => { l.push(`    - ${n.text} × ${n.count}`); if (n.orders.length) l.push(`      Orders: ${fmtO(n.orders)}`); }); }
      if (ok.length) { l.push(`  ✅ NO ISSUES:`); ok.forEach(n => { l.push(`    - ${n.text} × ${n.count}`); if (n.orders.length) l.push(`      Orders: ${fmtO(n.orders)}`); }); }
    });
    return l.join("\n");
  };

  const resetAll = () => {
    if (confirmReset) { setState({ mainCount: 0, branches: [] }); setConfirmReset(false); setActiveId(null); }
    else { setConfirmReset(true); setTimeout(() => setConfirmReset(false), 3000); }
  };

  // Re-find branch after state update
  const activeBranch = activeId ? state.branches.find(b => b.id === activeId) : null;

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20" style={{ WebkitTapHighlightColor: "transparent" }}>
      {/* Header */}
      <div className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-sm border-b border-zinc-800 px-3 py-2.5">
        <div className="flex items-center justify-between mb-1.5">
          <h1 className="text-base font-bold text-zinc-100">QA Tracker</h1>
          <div className="flex gap-1.5">
            <button onClick={() => setShowExport(true)} className="bg-zinc-800 active:bg-zinc-700 text-zinc-300 text-xs rounded-md px-2.5 py-1 touch-manipulation">Export</button>
            <button onClick={resetAll} className={`${confirmReset ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-300"} text-xs rounded-md px-2.5 py-1 touch-manipulation`}>{confirmReset ? "Confirm?" : "Reset"}</button>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-[10px] text-zinc-500 uppercase tracking-widest">Orders Reviewed</div>
          <Ctr value={state.mainCount} onChange={v => setState(p => ({ ...p, mainCount: v }))} />
        </div>
      </div>

      {/* Branch tabs */}
      <div className="px-3 pt-2.5">
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5 pb-2 items-stretch">
          {state.branches.map(b => (
            <button key={b.id} onClick={() => setActiveId(activeId === b.id ? null : b.id)}
              className={`w-full rounded-lg px-2 py-2 text-xs font-medium touch-manipulation transition-all flex items-center justify-center gap-1 break-all text-center ${activeId === b.id ? "bg-amber-500 text-zinc-900" : "bg-zinc-800 text-zinc-300 active:bg-zinc-700"}`}>
              {b.name}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeId === b.id ? "bg-amber-600 text-zinc-900" : "bg-zinc-700 text-zinc-400"}`}>{b.count}</span>
            </button>
          ))}
          {/* Inline add branch */}
          <div className="flex gap-1">
            <Grow value={branchName} onChange={e => setBranchName(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), addBranch())} placeholder="+ Branch" className="w-full bg-zinc-800 text-zinc-200 text-xs rounded-lg px-2.5 py-2 outline-none border border-dashed border-zinc-700 focus:border-amber-400 min-w-0" />
            {branchName.trim() && <button onClick={addBranch} className="bg-amber-500 text-zinc-900 text-xs font-bold rounded-lg px-2 touch-manipulation">+</button>}
          </div>
        </div>
      </div>

      {/* Notes for active branch */}
      {activeBranch && (
        <div className="px-3 pt-1 space-y-2">
          {/* Branch header bar */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-500">{activeBranch.notes.length} note{activeBranch.notes.length !== 1 ? "s" : ""}</span>
            <div className="flex gap-1.5">
              <Trip labels={["🧹", "⚠️", "💀"]} onConfirm={nukeNotes} />
              <Trip labels={["✕", "Sure?", "DEL"]} onConfirm={() => delBranch(activeBranch.id)} />
            </div>
          </div>

          {activeBranch.notes.map(note => {
            const tm = getT(note.id);
            const sev = SEVERITY[getSev(note)];
            const orders = note.orders.map(o => typeof o === "string" ? { num: o, time: null } : o);
            return (
              <div key={note.id} className={`rounded-xl p-2.5 space-y-1.5 border-l-4 ${sev.border} ${sev.card}`}>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => cycleSev(note)} className={`text-[10px] font-bold px-1.5 py-0.5 rounded touch-manipulation ${sev.bg} ${sev.text}`}>{sev.label}</button>
                  <span className="flex-1 text-sm text-zinc-200 truncate">{note.text}</span>
                  <Ctr value={note.count} onChange={v => setNoteCount(note, v)} size="sm" />
                  <button onClick={() => deleteNote(note.id)} className="text-zinc-600 active:text-red-400 text-xs px-1 touch-manipulation">✕</button>
                </div>

                <div className="flex gap-1 items-center">
                  <Grow value={getOI(note.id)} onChange={e => setOI(note.id, e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), addOrder(note))} placeholder="Order #" inputMode="text" className="flex-1 bg-zinc-800 text-zinc-100 text-xs rounded-md px-2 py-1.5 outline-none focus:ring-1 focus:ring-amber-400 min-w-0" />
                  <button onClick={() => setT(note.id, { show: !tm.show })} className={`text-xs rounded-md px-1.5 py-1.5 touch-manipulation ${tm.show ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-500"}`}>🕐</button>
                  <button onClick={() => addOrder(note)} className="bg-amber-500 active:bg-amber-600 text-zinc-900 font-semibold text-xs rounded-md px-2.5 py-1.5 touch-manipulation">Add</button>
                </div>

                {tm.show && (
                  <div className="flex items-center gap-1">
                    <input value={tm.h} onChange={e => { const v = e.target.value.replace(/\D/g, "").slice(0, 2); if (v === "" || Number(v) <= 12) setT(note.id, { h: v }); }} placeholder="HH" inputMode="numeric" className="w-10 h-8 bg-zinc-800 text-zinc-100 text-center text-xs font-mono rounded-md outline-none focus:ring-1 focus:ring-blue-400" />
                    <span className="text-zinc-500 font-bold">:</span>
                    <input value={tm.m} onChange={e => { const v = e.target.value.replace(/\D/g, "").slice(0, 2); if (v === "" || Number(v) <= 59) setT(note.id, { m: v }); }} placeholder="MM" inputMode="numeric" className="w-10 h-8 bg-zinc-800 text-zinc-100 text-center text-xs font-mono rounded-md outline-none focus:ring-1 focus:ring-blue-400" />
                    <button onClick={() => setT(note.id, { ap: "AM" })} className={`h-8 px-2 rounded-md text-[10px] font-bold touch-manipulation ${tm.ap === "AM" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-500"}`}>AM</button>
                    <button onClick={() => setT(note.id, { ap: "PM" })} className={`h-8 px-2 rounded-md text-[10px] font-bold touch-manipulation ${tm.ap === "PM" ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-500"}`}>PM</button>
                  </div>
                )}

                {orders.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {orders.map((o, i) => (
                      <span key={i} onClick={() => removeOrder(note, i)} className="bg-zinc-800 text-zinc-400 text-[10px] rounded px-1.5 py-0.5 cursor-pointer active:bg-red-900/40">#{o.num}{o.time ? ` at ${o.time}` : ""} ✕</span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          <div className="flex gap-1.5">
            <Grow value={noteName} onChange={e => setNoteName(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), addNote())} placeholder="New note..." className="flex-1 bg-zinc-900 text-zinc-200 text-sm rounded-xl px-3 py-2.5 outline-none border border-zinc-800 focus:border-amber-400 min-w-0" />
            <button onClick={addNote} className="bg-amber-500 active:bg-amber-600 text-zinc-900 font-semibold rounded-xl px-4 py-2.5 text-sm touch-manipulation">+</button>
          </div>
        </div>
      )}

      {!activeBranch && state.branches.length === 0 && (
        <div className="px-3 pt-12 text-center text-zinc-600 text-sm">Add a branch to get started</div>
      )}

      {/* Export modal */}
      {showExport && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col" onClick={() => setShowExport(false)}>
          <div className="flex-1 flex flex-col p-4 space-y-3" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
              <h2 className="text-white font-semibold text-lg">Export</h2>
              <button onClick={() => setShowExport(false)} className="text-zinc-400 text-2xl w-10 h-10 flex items-center justify-center touch-manipulation">✕</button>
            </div>
            <textarea ref={exportRef} readOnly value={report()} className="flex-1 bg-zinc-800 text-zinc-200 text-sm leading-relaxed rounded-xl p-4 outline-none resize-none font-mono" />
            <button onClick={async () => { try { await navigator.clipboard.writeText(report()); } catch { exportRef.current?.select(); } }} className="w-full bg-amber-500 active:bg-amber-600 text-zinc-900 font-semibold rounded-xl py-3 touch-manipulation">Copy</button>
          </div>
        </div>
      )}

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
    </div>
  );
}
