import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    console.log('Testing database connection...')
    await prisma.$connect()
    console.log('Database connected successfully')

    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('Query executed successfully:', result)

    await prisma.$disconnect()
    console.log('Database disconnected successfully')

    return NextResponse.json({
      status: 'success',
      message: 'Database connection test passed',
      timestamp: new Date().toISOString()
    })
  } catch (error: any) {
    console.error('Database connection error:', error)
    return NextResponse.json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}