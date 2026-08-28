import { create } from 'zustand';

export type NodeStatus = 'SAFE' | 'CRITICAL';
export type NodeType = 'PARENT' | 'NODE1' | 'NODE2' | 'NODE3';

export interface ModuleState {
  id: string;
  name: string;
  node_type: NodeType;
  crop_type: string;
  temp: number;
  humidity: number;
  co2: number;
  status: NodeStatus;
}

export interface SimulationState {
  // Modules keyed by ID
  modules: Record<string, ModuleState>;
  logs: string[];
  isSimulating: boolean;
  simulationTarget: {
    moduleId: string | null;
    type: 'SPOILAGE' | 'FUNGUS' | null;
  };
  globalModifiers: {
    temp: number;
    humidity: number;
    co2: number;
  };

  // Actions
  initializeModules: (modules: ModuleState[]) => void;
  triggerSpoilage: (moduleId: string) => void;
  triggerFungus: (moduleId: string) => void;
  setGlobalModifiers: (modifiers: { temp?: number; humidity?: number; co2?: number }) => void;
  addLog: (message: string) => void;
  tickSimulation: () => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  modules: {
    'm-parent': { id: 'm-parent', name: 'Parent Module', node_type: 'PARENT', crop_type: 'Onion', temp: 24, humidity: 10, co2: 5, status: 'SAFE' },
    'm-node1': { id: 'm-node1', name: 'Node Module 1', node_type: 'NODE1', crop_type: 'Tomato', temp: 24, humidity: 10, co2: 5, status: 'SAFE' },
    'm-node2': { id: 'm-node2', name: 'Node Module 2', node_type: 'NODE2', crop_type: 'Potato', temp: 24, humidity: 10, co2: 5, status: 'SAFE' },
    'm-node3': { id: 'm-node3', name: 'Node Module 3', node_type: 'NODE3', crop_type: 'Wheat', temp: 24, humidity: 10, co2: 5, status: 'SAFE' },
  },
  logs: [],
  isSimulating: false,
  simulationTarget: { moduleId: null, type: null },
  globalModifiers: { temp: 0, humidity: 0, co2: 0 },

  initializeModules: (modulesList) => {
    const modulesMap: Record<string, ModuleState> = {};
    modulesList.forEach(m => modulesMap[m.id] = m);
    set({ modules: modulesMap });
  },

  triggerSpoilage: (moduleId) => {
    const state = get();
    const mod = state.modules[moduleId];
    if (mod) {
      set({ 
        simulationTarget: { moduleId, type: 'SPOILAGE' },
        logs: [...state.logs, `> Spoilage simulation started for ${mod.name}. Temp & Gas will increase.`],
        isSimulating: true
      });
    }
  },

  triggerFungus: (moduleId) => {
    const state = get();
    const mod = state.modules[moduleId];
    if (mod) {
      set({ 
        simulationTarget: { moduleId, type: 'FUNGUS' },
        logs: [...state.logs, `> Fungus growth simulation started for ${mod.name}. Humidity will increase rapidly.`],
        isSimulating: true
      });
    }
  },

  setGlobalModifiers: (mods) => {
    set((state) => ({
      globalModifiers: { ...state.globalModifiers, ...mods }
    }));
  },

  addLog: (msg) => set((state) => ({ logs: [...state.logs, msg] })),

  resetSimulation: () => set((state) => {
    const newModules = { ...state.modules };
    Object.keys(newModules).forEach(key => {
      newModules[key] = {
        ...newModules[key],
        temp: 24,
        humidity: 10,
        co2: 5,
        status: 'SAFE'
      };
    });
    return {
      modules: newModules,
      globalModifiers: { temp: 0, humidity: 0, co2: 0 },
      isSimulating: false,
      simulationTarget: { moduleId: null, type: null },
      logs: [...state.logs, '> System rebooted. All nodes resetting to baseline safe levels.']
    };
  }),

  tickSimulation: () => {
    set((state) => {
      const newModules = { ...state.modules };
      let newLogs = [...state.logs];

      const targetId = state.simulationTarget.moduleId;
      const anomalyType = state.simulationTarget.type;
      
      // Check if the primary infected zone has reached critical mass (starts spreading)
      const isTargetCritical = targetId && newModules[targetId] ? newModules[targetId].status === 'CRITICAL' : false;

      Object.keys(newModules).forEach(key => {
         const mod = { ...newModules[key] };
         
         // Apply tiny random walk
         mod.temp += (Math.random() * 0.4 - 0.2);
         mod.humidity += (Math.random() * 1.0 - 0.5);
         mod.co2 += (Math.random() * 0.2 - 0.1);

         // Apply global modifiers
         mod.temp += (state.globalModifiers.temp * 0.05);
         mod.humidity += (state.globalModifiers.humidity * 0.05);
         mod.co2 += (state.globalModifiers.co2 * 0.05);

         // Process targeted anomaly and spread mechanics
         if (state.isSimulating && targetId && anomalyType) {
            if (targetId === mod.id) {
              // Primary Zone Effect (Strong)
              if (anomalyType === 'SPOILAGE') {
                mod.temp += (Math.random() * 0.5 + 0.2);
                mod.co2 += (Math.random() * 0.8 + 0.4);
              } else if (anomalyType === 'FUNGUS') {
                mod.humidity += (Math.random() * 1.5 + 0.5);
                mod.temp += (Math.random() * 0.2);
              }
            } else if (isTargetCritical) {
              // Spread Effect (Primary zone is critical, leaking ambiently into surrounding zones)
              if (anomalyType === 'SPOILAGE') {
                mod.temp += (Math.random() * 0.2 + 0.05);
                mod.co2 += (Math.random() * 0.3 + 0.1);
              } else if (anomalyType === 'FUNGUS') {
                mod.humidity += (Math.random() * 0.6 + 0.2);
                mod.temp += (Math.random() * 0.1);
              }
            }
         }

         // Keep bounds realistic
         mod.temp = Math.max(0, Math.min(60, mod.temp));
         mod.humidity = Math.max(0, Math.min(100, mod.humidity));
         mod.co2 = Math.max(0, Math.min(100, mod.co2));

         // Check thresholds
         const isCritical = mod.temp > 30 || mod.humidity > 60 || mod.co2 > 20;
         if (isCritical && mod.status === 'SAFE') {
            mod.status = 'CRITICAL';
            newLogs.push(`WARNING: ${mod.name} crossed critical thresholds!`);
         } else if (!isCritical && mod.status === 'CRITICAL') {
            mod.status = 'SAFE';
            newLogs.push(`SUCCESS: ${mod.name} stabilized.`);
         }

         newModules[key] = mod;
      });

      return { modules: newModules, logs: newLogs };
    });
  }
}));
