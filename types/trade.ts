export type TradeType = 'buy' | 'sell'

export interface Trade {
  id: string
  created_at: string
  stock_name: string
  stock_code?: string
  trade_type: TradeType
  quantity: number
  price: number
  total_amount: number
  trade_date: string
  memo?: string
}

export interface TradeInput {
  stock_name: string
  stock_code?: string
  trade_type: TradeType
  quantity: number
  price: number
  trade_date: string
  memo?: string
}

export interface TradeHeader {
  type: 'header'
  date: string
  id: string
}

export type TradeListItem = (Trade & { type: 'trade' }) | TradeHeader