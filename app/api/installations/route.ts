import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Installation from '@/lib/models/Installation';
import Module from '@/lib/models/Module';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await dbConnect();
    const installations = await Installation.find({}).lean();
    const allModules = await Module.find({}).lean();
    
    // Group modules by installation ID in memory (massive speedup, eliminates N+1 queries)
    const modulesByInst = allModules.reduce((acc: any, mod: any) => {
      const instId = mod.installation_id.toString();
      if (!acc[instId]) acc[instId] = [];
      acc[instId].push(mod);
      return acc;
    }, {});

    // For each installation, calculate average metrics from its modules
    const enriched = installations.map((inst: any) => {
      const modules = modulesByInst[inst._id.toString()] || [];
      
      let avgTemp = 0;
      let avgHum = 0;
      let avgCo2 = 0;

      if (modules.length > 0) {
        avgTemp = modules.reduce((acc: any, m: any) => acc + m.current_metrics.temp, 0) / modules.length;
        avgHum = modules.reduce((acc: any, m: any) => acc + m.current_metrics.humidity, 0) / modules.length;
        avgCo2 = modules.reduce((acc: any, m: any) => acc + m.current_metrics.co2, 0) / modules.length;
      }

      return {
        id: inst._id.toString(),
        name: inst.name,
        lat: inst.coordinates.lat,
        lng: inst.coordinates.lng,
        temp: avgTemp,
        humidity: avgHum,
        co2: avgCo2,
        status: inst.overall_status,
        nodesCount: modules.length
      };
    });

    return NextResponse.json(enriched);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
