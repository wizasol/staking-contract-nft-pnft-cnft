import { NextResponse } from 'next/server'
 
export async function GET(request: Request) {
    const { searchParams }= new URL(request.url)

    const formula = `{walletColumn} = "${searchParams.get('wallet')}"`;
    const API_URL = `https://api.airtable.com/v0/appOLxCqzLpnpcTku/Wallets?filterByFormula=${encodeURIComponent(
      formula
    )}`;

    const HEADERS = {
      Authorization: `Bearer ${process.env.API_KEY}`,
      "Content-Type": "application/json",
    };
    try {
        const response = await fetch(API_URL, { method: "GET", headers: HEADERS });

    const data = await response.json();
    return NextResponse.json({ data })
    } catch (error) {
return NextResponse.json({ error:'Some error' })
    }
    
  
}