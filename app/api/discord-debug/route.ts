import { NextRequest } from "next/server";
import { verifyKey } from 'discord-interactions';

export async function POST(req: NextRequest) {
  try {
    console.log('=== Discord Debug Endpoint ===');
    
    const rawBody = await req.text();
    const body = JSON.parse(rawBody);
    
    console.log('Body type:', body.type);
    
    // Get signature verification data
    const signature = req.headers.get('x-signature-ed25519');
    const timestamp = req.headers.get('x-signature-timestamp');
    const publicKey = process.env.DISCORD_PUBLIC_KEY;
    
    console.log('Signature verification data:');
    console.log('- Has signature:', !!signature);
    console.log('- Has timestamp:', !!timestamp);
    console.log('- Has public key:', !!publicKey);
    console.log('- Public key length:', publicKey?.length);
    
    if (!signature || !timestamp || !publicKey) {
      console.log('Missing verification data, returning 401');
      return Response.json({ error: 'Missing verification data' }, { status: 401 });
    }
    
    // Try signature verification
    let isValid = false;
    try {
      isValid = verifyKey(rawBody, signature, timestamp, publicKey);
      console.log('Signature verification result:', isValid);
    } catch (verifyError) {
      console.error('Signature verification error:', verifyError);
      return Response.json({ error: 'Signature verification failed' }, { status: 401 });
    }
    
    if (!isValid) {
      console.log('Invalid signature, returning 401');
      return Response.json({ error: 'Invalid signature' }, { status: 401 });
    }
    
    // Handle PING
    if (body.type === 1) {
      console.log('Sending PONG response');
      return Response.json({ type: 1 });
    }
    
    console.log('Non-PING request');
    return Response.json({ error: 'Not implemented' }, { status: 501 });
    
  } catch (error: any) {
    console.error('Debug endpoint error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ 
    message: 'Discord debug endpoint',
    hasPublicKey: !!process.env.DISCORD_PUBLIC_KEY,
    publicKeyLength: process.env.DISCORD_PUBLIC_KEY?.length
  });
}
