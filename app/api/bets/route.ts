import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const { userId, gameId, amount }: { userId: number; gameId: string; amount: number } = await request.json()
    const idempotencyKey = request.headers.get('Idempotency-Key')

    if (!idempotencyKey) {
      return NextResponse.json({ error: 'Idempotency-Key required' }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 })
    }

    // Check user balance
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.balance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    // Check if bet already exists
    const existingBet = await prisma.bet.findFirst({
      where: { userId, gameId, amount }
    })

    if (existingBet) {
      return NextResponse.json({ error: 'Bet already exists' }, { status: 409 })
    }

    // Create bet and deduct balance in transaction
    const bet = await prisma.$transaction(async (tx) => {
      const bet = await tx.bet.create({
        data: {
          userId,
          gameId,
          amount
        }
      })

      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: amount } }
      })

      await tx.ledger.create({
        data: {
          userId,
          type: 'BET_DEBIT',
          amount: -amount,
          betId: bet.id
        }
      })

      return bet
    })

    return NextResponse.json(bet)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}