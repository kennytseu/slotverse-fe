import { NextRequest, NextResponse } from "next/server";

// Simple test endpoint to debug Discord verification
export async function POST(req: NextRequest) {
  try {
    console.log('=== Discord Test Endpoint Called ===');
    console.log('Headers:', Object.fromEntries(req.headers.entries()));
    
    const rawBody = await req.text();
    console.log('Raw Body:', rawBody);
    
    let body;
    try {
      body = JSON.parse(rawBody);
      console.log('Parsed Body:', body);
    } catch (e) {
      console.log('Failed to parse JSON:', e);
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    // Handle Discord PING
    if (body.type === 1) {
      console.log('Responding to Discord PING');
      return NextResponse.json({ type: 1 });
    }

    console.log('Non-PING request received');
    return NextResponse.json({ 
      message: 'Test endpoint working',
      receivedType: body.type,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ 
      error: error.message,
      stack: error.stack 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    message: 'Discord test endpoint is working',
    timestamp: new Date().toISOString(),
    url: req.url
  });
}
