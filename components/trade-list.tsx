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
import { Trade } from '../types/trade'
import { supabase } from '../lib/supabase'

interface TradeListProps {
  refreshTrigger?: number
  isAdmin?: boolean
}

export default function TradeList({ refreshTrigger, isAdmin = false }: TradeListProps) {
  const [trades, setTrades] = useState<Trade[]>([])
  const [loading, setLoading] = useState(false)

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

  const renderItem = ({ item }: { item: Trade }) => {
    const isBuy = item.trade_type === 'buy'

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.badge,
                isBuy ? styles.buyBadge : styles.sellBadge,
              ]}
            >
              <Text style={styles.badgeText}>{isBuy ? '매수' : '매도'}</Text>
            </View>
            <Text style={styles.stockName}>{item.stock_name}</Text>
            {item.stock_code && (
              <Text style={styles.stockCode}>({item.stock_code})</Text>
            )}
          </View>
          {isAdmin && (
              <TouchableOpacity
                  onPress={() => handleDelete(item.id)}
                  style={styles.deleteButton}
              >
                <Text style={styles.deleteButtonText}>삭제</Text>
              </TouchableOpacity>
          )}
        </View>

        <View style={styles.cardBody}>
          <View style={styles.row}>
            <Text style={styles.label}>거래일</Text>
            <Text style={styles.value}>{item.trade_date}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>수량</Text>
            <Text style={styles.value}>{item.quantity.toLocaleString()}주</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>가격</Text>
            <Text style={styles.value}>
              {item.price.toLocaleString('ko-KR')}원
            </Text>
          </View>
          <View style={[styles.row, styles.totalRow]}>
            <Text style={styles.totalLabel}>총 거래금액</Text>
            <Text style={[styles.totalValue, isBuy ? styles.buyColor : styles.sellColor]}>
              {item.total_amount.toLocaleString('ko-KR')}원
            </Text>
          </View>
          {item.memo && (
            <View style={styles.memoContainer}>
              <Text style={styles.memoLabel}>메모</Text>
              <Text style={styles.memoText}>{item.memo}</Text>
            </View>
          )}
        </View>
      </View>
    )
  }

  if (trades.length === 0 && !loading) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>등록된 매매일지가 없습니다.</Text>
      </View>
    )
  }

  return (
    <FlatList
      data={trades}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={fetchTrades} />
      }
    />
  )
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 12,
  },
  buyBadge: {
    backgroundColor: '#ffebee',
  },
  sellBadge: {
    backgroundColor: '#e3f2fd',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  stockName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  stockCode: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#ff5252',
    borderRadius: 6,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  cardBody: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  totalRow: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  buyColor: {
    color: '#ef5350',
  },
  sellColor: {
    color: '#42a5f5',
  },
  memoContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  memoLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  memoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
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
})
