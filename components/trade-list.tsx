import { useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native'
import {Trade, TradeListItem} from '../types/trade'
import { supabase } from '../lib/supabase'

interface TradeListProps {
  refreshTrigger?: number
  isAdmin?: boolean
}

export default function TradeList({ refreshTrigger, isAdmin = false }: TradeListProps) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'buy' | 'sell'>('all')
  const [statsOpen, setStatsOpen] = useState(false)
  const [statsPeriod, setStatsPeriod] = useState<'week' | 'month' | '3month' | 'all'>('week')

  const fetchTrades = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('trades')
        .select('*')
        .order('trade_date', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error

      setTrades(data || [])
    } catch (error) {
      console.error('Error fetching trades:', error)
      Alert.alert('오류', '매매일지를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const filteredTrades = trades.filter(trade => {
    if (filter === 'all') return true
    return trade.trade_type === filter
  })

  const getStatsRange = () => {
    const now = new Date()
    if (statsPeriod === 'week') {
      const start = new Date(now)
      start.setDate(now.getDate() - 7)
      return start.toISOString().slice(0, 10)
    }
    if (statsPeriod === 'month') {
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    }
    if (statsPeriod === '3month') {
      const start = new Date(now)
      start.setMonth(now.getMonth() - 3)
      return start.toISOString().slice(0, 10)
    }
    return null
  }

  const statsData = (() => {
    const startDate = getStatsRange()
    const filtered = trades.filter(t => !startDate || t.trade_date >= startDate)

    const byTicker: Record<string, {
      stock_name: string
      buyAmount: number
      sellAmount: number
      buyQty: number
      sellQty: number
    }> = {}

    filtered.forEach(t => {
      if (!byTicker[t.stock_name]) {
        byTicker[t.stock_name] = { stock_name: t.stock_name, buyAmount: 0, sellAmount: 0, buyQty: 0, sellQty: 0 }
      }
      if (t.trade_type === 'buy') {
        byTicker[t.stock_name].buyAmount += t.total_amount
        byTicker[t.stock_name].buyQty += t.quantity
      } else {
        byTicker[t.stock_name].sellAmount += t.total_amount
        byTicker[t.stock_name].sellQty += t.quantity
      }
    })

    const totalBuy = filtered.filter(t => t.trade_type === 'buy').reduce((a, t) => a + t.total_amount, 0)
    const totalSell = filtered.filter(t => t.trade_type === 'sell').reduce((a, t) => a + t.total_amount, 0)

    return { byTicker: Object.values(byTicker), totalBuy, totalSell, count: filtered.length }
  })()

  const groupedData = filteredTrades.reduce((acc, trade) => {
    const date = trade.trade_date
    if (!acc.find(item => item.type === 'header' && item.date === date)) {
      acc.push({ type: 'header', date, id: `header-${date}` })
    }
    acc.push({type: 'trade', ...trade})
    return acc
  } , [] as any[])

  useEffect(() => {
    fetchTrades()
  }, [refreshTrigger])

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm('이 거래 내역을 삭제하시겠습니까?')
    if (!confirmed) return

    try {
      const { error } = await supabase.from('trades').delete().eq('id', id)
      if (error) throw error
      fetchTrades()
    } catch (error) {
      console.error('Error deleting trade:', error)
      window.alert('삭제 중 오류가 발생했습니다.')
    }
  }

  const renderItem = ({ item }: { item: TradeListItem }) => {
    if (item.type === 'header') {
      const [year, month, day] = item.date.split('-')
      return (
          <View style={styles.dateHeader}>
            <View style={styles.dateLine} />
            <Text style={styles.dateText}>{month}/{day}</Text>
            <View style={styles.dateLine}/>
          </View>
      )
    }
    const isBuy = item.trade_type === 'buy'

    return (
        <View style={styles.card}>
          <View style={styles.cardRow}>
            {/* 왼쪽: 종목 정보 + 메모 */}
            <View style={styles.cardLeft}>
              <View style={[styles.badge, isBuy ? styles.buyBadge : styles.sellBadge]}>
                <Text style={styles.badgeText}>{isBuy ? '매수' : '매도'}</Text>
              </View>
              <View>
                <View style={styles.nameRow}>
                  <Text style={styles.stockName}>{item.stock_name}</Text>
                  {item.stock_code && (
                      <Text style={styles.stockCode}>({item.stock_code})</Text>
                  )}
                </View>
                {item.memo && (
                    <Text style={styles.memoInline}>{item.memo}</Text>
                )}
              </View>
            </View>

            {/* 오른쪽: 금액 정보 */}
            <View style={styles.cardRight}>
              <Text style={styles.tradeDetail}>
                {item.quantity.toLocaleString()}주 · {item.price.toLocaleString('ko-KR')}원
              </Text>
              <Text style={[styles.totalAmount, isBuy ? styles.buyColor : styles.sellColor]}>
                {item.total_amount.toLocaleString('ko-KR')}원
              </Text>
              {isAdmin && (
                  <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteButton}>
                    <Text style={styles.deleteButtonText}>삭제</Text>
                  </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
    )
  }

  return (
      <View style={{ flex: 1 }}>
        {/* 통계 패널 */}
        <TouchableOpacity style={styles.statsToggle} onPress={() => setStatsOpen(v => !v)}>
          <Text style={styles.statsToggleText}>기간별 통계</Text>
          <Text style={styles.statsToggleIcon}>{statsOpen ? '▲' : '▼'}</Text>
        </TouchableOpacity>

        {statsOpen && (
            <View style={styles.statsPanel}>
              {/* 기간 선택 */}
              <View style={styles.periodRow}>
                {([
                  { key: 'week', label: '이번 주' },
                  { key: 'month', label: '이번 달' },
                  { key: '3month', label: '3개월' },
                  { key: 'all', label: '전체' },
                ] as const).map(({ key, label }) => (
                    <TouchableOpacity
                        key={key}
                        style={[styles.periodBtn, statsPeriod === key && styles.periodBtnActive]}
                        onPress={() => setStatsPeriod(key)}
                    >
                      <Text style={[styles.periodBtnText, statsPeriod === key && styles.periodBtnTextActive]}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                ))}
              </View>

              {/* 요약 카드 */}
              <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>총 매수금액</Text>
                  <Text style={[styles.summaryValue, styles.buyColor]}>
                    {statsData.totalBuy.toLocaleString('ko-KR')}원
                  </Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>총 매도금액</Text>
                  <Text style={[styles.summaryValue, styles.sellColor]}>
                    {statsData.totalSell.toLocaleString('ko-KR')}원
                  </Text>
                </View>
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryLabel}>거래 횟수</Text>
                  <Text style={styles.summaryValue}>{statsData.count}회</Text>
                </View>
              </View>

              {/* 종목별 테이블 */}
              <View style={styles.tickerTable}>
                <View style={styles.tickerHeader}>
                  <Text style={[styles.tickerCell, { flex: 2 }]}>종목</Text>
                  <Text style={[styles.tickerCell, styles.tickerRight]}>매수</Text>
                  <Text style={[styles.tickerCell, styles.tickerRight]}>매도</Text>
                  <Text style={[styles.tickerCell, styles.tickerRight]}>매수량</Text>
                  <Text style={[styles.tickerCell, styles.tickerRight]}>매도량</Text>
                </View>
                {statsData.byTicker.map(t => (
                    <View key={t.stock_name} style={styles.tickerRow}>
                      <Text style={[styles.tickerCell, { flex: 2 }]}>{t.stock_name}</Text>
                      <Text style={[styles.tickerCell, styles.tickerRight, styles.buyColor]}>
                        {t.buyAmount > 0 ? t.buyAmount.toLocaleString('ko-KR') : '-'}
                      </Text>
                      <Text style={[styles.tickerCell, styles.tickerRight, styles.sellColor]}>
                        {t.sellAmount > 0 ? t.sellAmount.toLocaleString('ko-KR') : '-'}
                      </Text>
                      <Text style={[styles.tickerCell, styles.tickerRight]}>
                        {t.buyQty > 0 ? `${t.buyQty}주` : '-'}
                      </Text>
                      <Text style={[styles.tickerCell, styles.tickerRight]}>
                        {t.sellQty > 0 ? `${t.sellQty}주` : '-'}
                      </Text>
                    </View>
                ))}
              </View>
            </View>
        )}
        <View style={styles.filterContainer}>
          {(['all', 'buy', 'sell'] as const).map((type) => (
              <TouchableOpacity
                  key={type}
                  style={[styles.filterTab, filter === type && styles.filterTabActive]}
                  onPress={() => setFilter(type)}
              >
                <Text style={[styles.filterTabText, filter === type && styles.filterTabTextActive]}>
                  {type === 'all' ? '전체' : type === 'buy' ? '매수' : '매도'}
                </Text>
              </TouchableOpacity>
          ))}
        </View>

        {filteredTrades.length === 0 && !loading ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>등록된 매매일지가 없습니다.</Text>
            </View>
        ) : (
            <FlatList
                data={groupedData}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.list}
                refreshControl={
                  <RefreshControl refreshing={loading} onRefresh={fetchTrades} />
                }
            />
        )}
      </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 10,
    flexShrink: 1,
    marginRight: 12,
  },
  cardRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stockName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  stockCode: {
    fontSize: 12,
    color: '#999',
  },
  tradeDetail: {
    fontSize: 13,
    color: '#666',
    textAlign: 'right',
  },
  totalAmount: {
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  memoInline: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 3,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 2,
  },
  buyBadge: {
    backgroundColor: '#ffebee',
  },
  sellBadge: {
    backgroundColor: '#e3f2fd',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  deleteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#ff5252',
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  list: {
    padding: 16,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  buyColor: {
    color: '#ef5350',
  },
  sellColor: {
    color: '#42a5f5',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  filterContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  filterTabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#333',
  },
  filterTabText: {
    fontSize: 14,
    color: '#999',
  },
  filterTabTextActive: {
    color: '#333',
    fontWeight: 'bold',
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  dateLine: {
    flex: 1,
    height: 0.5,
    backgroundColor: '#ddd',
  },
  dateText: {
    fontSize: 13,
    color: '#999',
    fontWeight: '600',
  },
  statsToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#406093',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  statsToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  statsToggleIcon: {
    fontSize: 12,
    color: '#666',
  },
  statsPanel: {
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  periodRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: '#ddd',
  },
  periodBtnActive: {
    backgroundColor: '#333',
    borderColor: '#333',
  },
  periodBtnText: {
    fontSize: 12,
    color: '#666',
  },
  periodBtnTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 0.5,
    borderColor: '#eee',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  tickerTable: {
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: '#eee',
  },
  tickerHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderBottomWidth: 0.5,
    borderBottomColor: '#eee',
  },
  tickerRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f0f0f0',
  },
  tickerCell: {
    flex: 1,
    fontSize: 12,
    color: '#333',
  },
  tickerRight: {
    textAlign: 'right',
  },
})
