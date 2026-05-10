import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
    }

    const userIdNum = parseInt(userId)

    // Get current balance from user
    const user = await prisma.user.findUnique({
      where: { id: userIdNum },
      select: { balance: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Calculate balance from ledger
    const ledgerEntries = await prisma.ledger.findMany({
      where: { userId: userIdNum }
    })

    let ledgerBalance = 0
    ledgerEntries.forEach(entry => {
      if (entry.type === 'DEPOSIT' || entry.type === 'BET_CREDIT' || entry.type === 'BET_REFUND') {
        ledgerBalance += entry.amount
      } else if (entry.type === 'BET_DEBIT') {
        ledgerBalance += entry.amount // amount is negative
      }
    })

    // Get bet statistics
    const bets = await prisma.bet.findMany({
      where: { userId: userIdNum }
    })

    const betStats = {
      total: bets.length,
      placed: bets.filter(b => b.status === 'PLACED').length,
      settled: bets.filter(b => b.status === 'SETTLED').length,
      cancelled: bets.filter(b => b.status === 'CANCELLED').length
    }

    // Check for anomalies
    const anomalies = []
    if (Math.abs(user.balance - ledgerBalance) > 0.01) {
      anomalies.push('Balance mismatch between user and ledger')
    }

    const duplicateBets = bets.filter((bet, index, arr) =>
      arr.findIndex(b => b.gameId === bet.gameId && b.amount === bet.amount) !== index
    )
    if (duplicateBets.length > 0) {
      anomalies.push('Duplicate bets found')
    }

    return NextResponse.json({
      userBalance: user.balance,
      ledgerBalance,
      betStats,
      anomalies
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}