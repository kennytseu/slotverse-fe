import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log('=== Simple Discord Endpoint Called ===');
    
    const rawBody = await req.text();
    console.log('Raw body length:', rawBody.length);
    
    const body = JSON.parse(rawBody);
    console.log('Parsed body type:', body.type);
    
    // Handle Discord PING
    if (body.type === 1) {
      console.log('Sending PONG response');
      return new Response(JSON.stringify({ type: 1 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    console.log('Non-PING request received');
    return new Response(JSON.stringify({ error: 'Not implemented' }), {
      status: 501,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    console.error('Simple endpoint error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function GET() {
  return new Response(JSON.stringify({ 
    message: 'Simple Discord endpoint working',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}
