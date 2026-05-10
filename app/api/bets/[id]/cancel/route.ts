import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const betId = parseInt(params.id)

    const bet = await prisma.bet.findUnique({
      where: { id: betId }
    })

    if (!bet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 })
    }

    if (bet.status !== 'PLACED') {
      return NextResponse.json({ error: 'Bet cannot be cancelled' }, { status: 400 })
    }

    // Cancel bet and refund in transaction
    await prisma.$transaction(async (tx) => {
      await tx.bet.update({
        where: { id: betId },
        data: { status: 'CANCELLED' }
      })

      await tx.user.update({
        where: { id: bet.userId },
        data: { balance: { increment: bet.amount } }
      })

      await tx.ledger.create({
        data: {
          userId: bet.userId,
          type: 'BET_REFUND',
          amount: bet.amount,
          betId: betId
        }
      })
    })

    return NextResponse.json({ message: 'Bet cancelled' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}