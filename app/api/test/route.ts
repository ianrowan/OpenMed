import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({ 
    message: 'OpenMed API is working!', 
    timestamp: new Date().toISOString() 
  })
}

export async function POST() {
  return NextResponse.json({ 
    message: 'POST endpoint working!', 
    timestamp: new Date().toISOString() 
  })
}
