import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    console.log('=== Simple Discord Endpoint Called ===');
    
    let body;
    try {
      body = await req.json();
      console.log('JSON parsed directly, type:', body.type);
    } catch (jsonError) {
      console.error('JSON parsing failed:', jsonError);
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Handle Discord PING
    if (body.type === 1) {
      console.log('About to send PONG response with NextResponse');
      try {
        const response = NextResponse.json({ type: 1 });
        console.log('NextResponse PONG created successfully');
        return response;
      } catch (error) {
        console.error('NextResponse failed, trying native Response:', error);
        return new Response('{"type":1}', {
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    console.log('Non-PING request received, type:', body.type);
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
