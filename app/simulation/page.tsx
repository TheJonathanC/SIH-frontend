'use client';

import { useState, useEffect } from 'react';
import { useSimulationStore } from '@/store/useSimulationStore';
import { Bug, ThermometerSun, Leaf, CircleDashed, Plus, Minus, RotateCcw, MessageSquare } from 'lucide-react';

const ModifierControl = ({ label, value, onChange, unit, min, max, step = 1 }: any) => (
  <div className="bg-neutral-900/40 rounded-xl p-3 border border-white/5 flex items-center justify-between">
    <div className="flex flex-col">
      <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">{label}</span>
    </div>
    
    <div className="flex items-center gap-2 bg-black/40 rounded-lg p-1 border border-white/5">
      <button 
        onClick={() => onChange(Math.max(min, value - step))}
        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
      >
        <Minus className="w-3.5 h-3.5" />
      </button>
      
      <div className="w-10 text-center font-mono text-xs text-neutral-200">
        {value > 0 ? '+' : ''}{value}{unit}
      </div>
      
      <button 
        onClick={() => onChange(Math.min(max, value + step))}
        className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/10 text-neutral-400 hover:text-white transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
);

export default function SimulationPage() {
  const { 
    modules, 
    logs, 
    triggerSpoilage, 
    triggerFungus, 
    setGlobalModifiers, 
    tickSimulation,
    resetSimulation,
    globalModifiers
  } = useSimulationStore();

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, moduleId: string } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      tickSimulation();
    }, 1000);
    return () => clearInterval(interval);
  }, [tickSimulation]);

  const handleSackClick = (e: React.MouseEvent, moduleId: string) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenu({ x: rect.right, y: rect.top, moduleId });
  };

  const closeContext = () => setContextMenu(null);

  const getModBg = (status: string) => status === 'SAFE' ? 'bg-green-500/5' : 'bg-red-500/10';
  const getModBorder = (status: string) => status === 'SAFE' ? 'border-green-500/20' : 'border-red-500/40';

  return (
    <div className="flex h-[calc(100vh-56px)] bg-neutral-950 font-sans text-sm" onClick={closeContext}>
      
      {/* Left Pane: Interactive Grid */}
      <div className="w-1/2 p-10 border-r border-white/5 flex items-center justify-center relative bg-[#0a0a0a]">
        <div className="w-full max-w-xl aspect-square bg-neutral-900/40 rounded-3xl p-4 border border-white/5 shadow-2xl relative grid grid-cols-2 grid-rows-2 gap-4">
          
          {Object.values(modules).map((mod) => (
            <div key={mod.id} className={`border rounded-2xl p-4 flex flex-col justify-between relative transition-colors ${getModBorder(mod.status)} ${getModBg(mod.status)}`}>
               
               <div className="flex justify-between items-center z-10 mb-2">
                 <span className="text-xs font-semibold tracking-wider text-neutral-400 bg-neutral-950 border border-white/10 px-3 py-1 rounded-full shadow-sm">
                   {mod.node_type === 'PARENT' ? 'P1' : mod.node_type.replace('NODE', 'N')}
                 </span>
                 <span className="text-[9px] text-neutral-500 uppercase tracking-wider">{mod.crop_type}</span>
               </div>

               {/* Sacks Grid */}
               <div className="flex-1 grid grid-cols-2 gap-2 my-2 z-10 relative px-4 py-2">
                 {[1, 2, 3, 4].map(idx => (
                    <div 
                      key={idx}
                      className="flex items-center justify-center rounded-full border border-white/10 bg-black/40 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group"
                      onClick={(e) => handleSackClick(e, mod.id)}
                    >
                      <CircleDashed className="w-5 h-5 text-neutral-600 group-hover:text-neutral-400 transition-colors" />
                    </div>
                 ))}
               </div>

               {/* Always visible live metrics */}
               <div className="grid grid-cols-3 gap-1.5 z-10 mt-2">
                 <div className="bg-black/40 rounded-lg p-2 border border-white/5 flex flex-col items-center">
                   <div className="text-[9px] uppercase text-neutral-500 mb-0.5 tracking-wider">Temp</div>
                   <div className={`font-mono text-[11px] ${mod.temp > 30 ? 'text-red-400' : 'text-neutral-200'}`}>{mod.temp.toFixed(1)}°</div>
                 </div>
                 <div className="bg-black/40 rounded-lg p-2 border border-white/5 flex flex-col items-center">
                   <div className="text-[9px] uppercase text-neutral-500 mb-0.5 tracking-wider">Hum</div>
                   <div className={`font-mono text-[11px] ${mod.humidity > 60 ? 'text-red-400' : 'text-neutral-200'}`}>{mod.humidity.toFixed(1)}%</div>
                 </div>
                 <div className="bg-black/40 rounded-lg p-2 border border-white/5 flex flex-col items-center">
                   <div className="text-[9px] uppercase text-neutral-500 mb-0.5 tracking-wider">CO2</div>
                   <div className={`font-mono text-[11px] ${mod.co2 > 20 ? 'text-red-400' : 'text-neutral-200'}`}>{mod.co2.toFixed(1)}%</div>
                 </div>
               </div>

            </div>
          ))}

          {/* Context Menu for click */}
          {contextMenu && (
             <div 
               className="fixed bg-neutral-900 border border-white/10 p-1.5 rounded-xl z-50 shadow-2xl w-48 animate-in slide-in-from-left-2 duration-200"
               style={{ top: contextMenu.y - 40, left: contextMenu.x + 16 }}
               onClick={(e) => e.stopPropagation()}
             >
                <div className="text-[10px] text-neutral-500 uppercase font-semibold tracking-wider px-3 py-2 mb-1">Simulate Anomaly</div>
                <button 
                  className="flex items-center gap-3 w-full text-left px-3 py-2 hover:bg-red-500/10 hover:text-red-400 text-sm text-neutral-300 rounded-lg transition-colors"
                  onClick={() => { triggerSpoilage(contextMenu.moduleId); closeContext(); }}
                >
                  <ThermometerSun className="w-4 h-4" /> Spoilage
                </button>
                <button 
                  className="flex items-center gap-3 w-full text-left px-3 py-2 hover:bg-green-500/10 hover:text-green-400 text-sm text-neutral-300 rounded-lg transition-colors mt-1"
                  onClick={() => { triggerFungus(contextMenu.moduleId); closeContext(); }}
                >
                  <Bug className="w-4 h-4" /> Fungus Growth
                </button>
             </div>
          )}

        </div>
      </div>

      {/* Right Pane */}
      <div className="w-1/2 flex flex-col p-8 gap-8 bg-neutral-950">
        
        {/* Top Right: Inputs */}
        <div className="border border-white/5 p-6 rounded-2xl bg-white/[0.02] flex-none">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="font-medium text-white">Global Modifiers</h3>
              <p className="text-xs text-neutral-500 mt-1">Adjust baseline room parameters</p>
            </div>
            <button 
              onClick={resetSimulation}
              className="flex items-center gap-2 bg-neutral-900 border border-white/10 hover:border-white/20 hover:bg-neutral-800 text-neutral-400 hover:text-white px-3 py-1.5 rounded-lg transition-all text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
          </div>

          <div className="space-y-3">
            <ModifierControl 
              label="Temperature Variance" 
              value={globalModifiers.temp} 
              unit="°C" min={-10} max={10} step={1}
              onChange={(val: number) => setGlobalModifiers({ temp: val })} 
            />
            <ModifierControl 
              label="Humidity Variance" 
              value={globalModifiers.humidity} 
              unit="%" min={-20} max={20} step={2}
              onChange={(val: number) => setGlobalModifiers({ humidity: val })} 
            />
            <ModifierControl 
              label="Gas (CO2) Variance" 
              value={globalModifiers.co2} 
              unit="%" min={-10} max={10} step={1}
              onChange={(val: number) => setGlobalModifiers({ co2: val })} 
            />
          </div>

          {/* Emergency Alert Section */}
          <div className="mt-6 pt-6 border-t border-white/5">
               <button 
                 onClick={async () => {
                   try {
                     useSimulationStore.getState().addLog('> Dispatched Emergency SMS to +918762471304...');
                     const res = await fetch('/api/sms', {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({
                         phone_number: '+918762471304',
                         message: 'DRISHTI ALERT: Critical environmental thresholds breached in Storage Zone. Immediate inspection required.'
                       })
                     });
                     if (res.ok) {
                       useSimulationStore.getState().addLog('> SUCCESS: SMS alert delivered successfully.');
                     } else {
                       useSimulationStore.getState().addLog('> ERROR: Failed to deliver SMS alert.');
                     }
                   } catch (err) {
                     useSimulationStore.getState().addLog('> ERROR: Network failure dispatching SMS.');
                   }
                 }}
                 className="flex items-center justify-center gap-2 w-full bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 px-4 py-2.5 rounded-lg transition-all text-xs font-semibold tracking-wide uppercase"
               >
                 <MessageSquare className="w-4 h-4" />
                 Send SMS Alert
               </button>
          </div>
        </div>

        {/* Bottom Right: Output Log */}
        <div className="border border-white/10 rounded-2xl bg-[#050505] flex-1 flex flex-col relative overflow-hidden shadow-inner">
          <div className="flex items-center px-4 py-3 border-b border-white/10 bg-neutral-900/50">
            <span className="text-xs font-mono text-neutral-500">simulation_output.log</span>
          </div>
          
          <div className="overflow-y-auto flex-1 p-4 font-mono text-[13px] leading-relaxed">
            {logs.length === 0 ? (
              <p className="text-neutral-600">waiting for simulation events...</p>
            ) : (
              <div className="space-y-1.5">
                {logs.map((log, i) => {
                  const isWarning = log.includes('WARNING');
                  return (
                    <div key={i} className={`animate-in fade-in slide-in-from-bottom-1 ${isWarning ? 'text-red-400 font-semibold bg-red-500/10 px-2 py-0.5 rounded' : 'text-neutral-300'}`}>
                      <span className="text-neutral-600 mr-2">[{new Date().toLocaleTimeString()}]</span>
                      {log}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
