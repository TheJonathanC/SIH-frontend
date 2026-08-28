import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    // Proxy the request from the server to bypass browser CORS restrictions
    const res = await fetch('https://sih-drishti-backend.onrender.com/api/sms/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `External API responded with status: ${res.status}` }, 
        { status: res.status }
      );
    }

    const data = await res.json().catch(() => ({}));
    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('SMS Proxy Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
