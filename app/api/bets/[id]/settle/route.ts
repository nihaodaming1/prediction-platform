import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const betId = parseInt(params.id)
    const { result }: { result: 'WIN' | 'LOSE' } = await request.json()

    const bet = await prisma.bet.findUnique({
      where: { id: betId },
      include: { user: true }
    })

    if (!bet) {
      return NextResponse.json({ error: 'Bet not found' }, { status: 404 })
    }

    if (bet.status !== 'PLACED') {
      return NextResponse.json({ error: 'Bet already settled or cancelled' }, { status: 400 })
    }

    let creditAmount = 0
    if (result === 'WIN') {
      creditAmount = bet.amount * 2 // Assuming 1:1 payout for simplicity
    }

    // Settle bet in transaction
    await prisma.$transaction(async (tx) => {
      await tx.bet.update({
        where: { id: betId },
        data: {
          status: 'SETTLED',
          settledAt: new Date()
        }
      })

      if (result === 'WIN') {
        await tx.user.update({
          where: { id: bet.userId },
          data: { balance: { increment: creditAmount } }
        })

        await tx.ledger.create({
          data: {
            userId: bet.userId,
            type: 'BET_CREDIT',
            amount: creditAmount,
            betId: betId
          }
        })
      }
    })

    return NextResponse.json({ message: 'Bet settled' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}