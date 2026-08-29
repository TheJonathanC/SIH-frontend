import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Installation from '@/lib/models/Installation';
import Module from '@/lib/models/Module';
import Telemetry from '@/lib/models/Telemetry';

// This endpoint can be hit by a cron job or client-side polling to simulate time passing
export async function POST() {
  try {
    await dbConnect();
    
    const modules = await Module.find({});
    
    // Prepare bulk operations for massive speedup on Vercel
    const bulkOps = [];
    const telemetryOps = [];
    
    for (const mod of modules) {
      // Simulate natural fluctuation (random walk)
      let newTemp = mod.current_metrics.temp + (Math.random() * 0.8 - 0.4);
      let newHum = mod.current_metrics.humidity + (Math.random() * 2.0 - 1.0);
      let newCo2 = mod.current_metrics.co2 + (Math.random() * 1.0 - 0.5);

      // Keep within bounds roughly
      newTemp = Math.max(10, Math.min(50, newTemp));
      newHum = Math.max(0, Math.min(100, newHum));
      newCo2 = Math.max(0, Math.min(100, newCo2));

      // Check thresholds
      const isCritical = newTemp > 30 || newHum > 60 || newCo2 > 20;
      const newStatus = isCritical ? 'CRITICAL' : 'SAFE';
      const justBecameCritical = isCritical && mod.status !== 'CRITICAL';

      // Queue the module update
      bulkOps.push({
        updateOne: {
          filter: { _id: mod._id },
          update: { 
            $set: { 
              current_metrics: { temp: newTemp, humidity: newHum, co2: newCo2 },
              status: newStatus 
            } 
          }
        }
      });

      // Throttled history logging queue
      if (Math.random() < 0.02 || justBecameCritical) {
        telemetryOps.push({
          module_id: mod._id,
          metrics: { temp: newTemp, humidity: newHum, co2: newCo2 }
        });
      }
    }

    // Execute all database updates in just two high-speed queries!
    if (bulkOps.length > 0) {
      await Module.bulkWrite(bulkOps);
    }
    if (telemetryOps.length > 0) {
      await Telemetry.insertMany(telemetryOps);
    }

    // Update Installation overall status concurrently
    const installations = await Installation.find({});
    const instBulkOps = [];

    await Promise.all(installations.map(async (inst) => {
      const instModules = await Module.find({ installation_id: inst._id }).lean();
      const hasCritical = instModules.some((m: any) => m.status === 'CRITICAL');
      
      let newStatus = inst.overall_status;
      if (hasCritical && inst.overall_status !== 'CRITICAL') {
        newStatus = 'CRITICAL';
      } else if (!hasCritical && inst.overall_status !== 'SAFE') {
        newStatus = 'SAFE';
      }

      if (newStatus !== inst.overall_status) {
        instBulkOps.push({
          updateOne: {
            filter: { _id: inst._id },
            update: { $set: { overall_status: newStatus } }
          }
        });
      }
    }));

    if (instBulkOps.length > 0) {
      await Installation.bulkWrite(instBulkOps);
    }

    return NextResponse.json({ message: 'Simulation tick completed successfully.' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
