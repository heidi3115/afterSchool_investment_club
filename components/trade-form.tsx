import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native'
import { TradeType, TradeInput } from '../types/trade'
import { supabase } from '../lib/supabase'

interface TradeFormProps {
  onSuccess?: () => void
}

export default function TradeForm({ onSuccess }: TradeFormProps) {
  const [formData, setFormData] = useState<TradeInput>({
    stock_name: '',
    stock_code: '',
    trade_type: 'buy',
    quantity: 0,
    price: 0,
    trade_date: new Date().toISOString().split('T')[0],
    memo: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!formData.stock_name.trim()) {
      Alert.alert('알림', '종목명을 입력해주세요.')
      return
    }
    if (formData.quantity <= 0) {
      Alert.alert('알림', '수량을 입력해주세요.')
      return
    }
    if (formData.price <= 0) {
      Alert.alert('알림', '가격을 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      const total_amount = formData.quantity * formData.price

      const { error } = await supabase.from('trades').insert({
        stock_name: formData.stock_name,
        stock_code: formData.stock_code || null,
        trade_type: formData.trade_type,
        quantity: formData.quantity,
        price: formData.price,
        total_amount,
        trade_date: formData.trade_date,
        memo: formData.memo || null,
      })

      if (error) throw error

      Alert.alert('성공', '매매일지가 등록되었습니다.')

      // 폼 초기화
      setFormData({
        stock_name: '',
        stock_code: '',
        trade_type: 'buy',
        quantity: 0,
        price: 0,
        trade_date: new Date().toISOString().split('T')[0],
        memo: '',
      })

      onSuccess?.()
    } catch (error) {
      console.error('Error:', error)
      Alert.alert('오류', '매매일지 등록 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        <Text style={styles.title}>매매일지 등록</Text>

        <View style={styles.tradeTypeContainer}>
          <TouchableOpacity
            style={[
              styles.tradeTypeButton,
              formData.trade_type === 'buy' && styles.buyButton,
            ]}
            onPress={() => setFormData({ ...formData, trade_type: 'buy' })}
          >
            <Text
              style={[
                styles.tradeTypeText,
                formData.trade_type === 'buy' && styles.tradeTypeTextActive,
              ]}
            >
              매수
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tradeTypeButton,
              formData.trade_type === 'sell' && styles.sellButton,
            ]}
            onPress={() => setFormData({ ...formData, trade_type: 'sell' })}
          >
            <Text
              style={[
                styles.tradeTypeText,
                formData.trade_type === 'sell' && styles.tradeTypeTextActive,
              ]}
            >
              매도
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>종목명 *</Text>
          <TextInput
            style={styles.input}
            value={formData.stock_name}
            onChangeText={(text) =>
              setFormData({ ...formData, stock_name: text })
            }
            placeholder="예: 삼성전자"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>종목코드</Text>
          <TextInput
            style={styles.input}
            value={formData.stock_code}
            onChangeText={(text) =>
              setFormData({ ...formData, stock_code: text })
            }
            placeholder="예: 005930"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>수량 *</Text>
          <TextInput
            style={styles.input}
            value={formData.quantity ? String(formData.quantity) : ''}
            onChangeText={(text) =>
              setFormData({ ...formData, quantity: parseInt(text) || 0 })
            }
            placeholder="0"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>가격 *</Text>
          <TextInput
            style={styles.input}
            value={formData.price ? String(formData.price) : ''}
            onChangeText={(text) =>
              setFormData({ ...formData, price: parseFloat(text) || 0 })
            }
            placeholder="0"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>거래일 *</Text>
          <TextInput
            style={styles.input}
            value={formData.trade_date}
            onChangeText={(text) =>
              setFormData({ ...formData, trade_date: text })
            }
            placeholder="YYYY-MM-DD"
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>메모</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.memo}
            onChangeText={(text) => setFormData({ ...formData, memo: text })}
            placeholder="메모를 입력하세요"
            multiline
            numberOfLines={4}
          />
        </View>

        {formData.quantity > 0 && formData.price > 0 && (
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>총 거래금액</Text>
            <Text style={styles.totalAmount}>
              {(formData.quantity * formData.price).toLocaleString('ko-KR')}원
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitButtonText}>
            {loading ? '등록 중...' : '등록하기'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  form: {
    padding: 20,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#333',
  },
  tradeTypeContainer: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  tradeTypeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#e0e0e0',
    alignItems: 'center',
  },
  buyButton: {
    backgroundColor: '#ef5350',
  },
  sellButton: {
    backgroundColor: '#42a5f5',
  },
  tradeTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  tradeTypeTextActive: {
    color: '#fff',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  totalContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ef5350',
  },
  submitButton: {
    backgroundColor: '#333',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#999',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
})
