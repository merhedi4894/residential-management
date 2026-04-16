import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    DATABASE_URL: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'UNDEFINED',
    NODE_ENV: process.env.NODE_ENV || 'UNDEFINED',
    allKeys: Object.keys(process.env).filter(k => !k.includes('SECRET') && !k.includes('TOKEN') && !k.includes('KEY') && !k.includes('PASSWORD')),
  });
}
