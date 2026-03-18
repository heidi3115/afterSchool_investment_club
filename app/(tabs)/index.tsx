import { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
} from 'react-native'
import TradeForm from '../../components/trade-form'
import TradeList from '../../components/trade-list'

export default function App() {
  const [activeTab, setActiveTab] = useState<'form' | 'list'>('form')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const { width } = useWindowDimensions()
  const isLargeScreen = width >= 768

  const handleFormSuccess = () => {
    setRefreshTrigger((prev) => prev + 1)
    if (isLargeScreen) {
      // 큰 화면에서는 탭 전환 없이 목록만 새로고침
    } else {
      // 작은 화면에서는 목록 탭으로 이동
      setActiveTab('list')
    }
  }

  if (isLargeScreen) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>주식 매매일지</Text>
        </View>
        <View style={styles.splitView}>
          <View style={styles.leftPanel}>
            <TradeForm onSuccess={handleFormSuccess} />
          </View>
          <View style={styles.rightPanel}>
            <TradeList refreshTrigger={refreshTrigger} />
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>주식 매매일지</Text>
      </View>
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'form' && styles.activeTab]}
          onPress={() => setActiveTab('form')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'form' && styles.activeTabText,
            ]}
          >
            등록
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'list' && styles.activeTab]}
          onPress={() => setActiveTab('list')}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'list' && styles.activeTabText,
            ]}
          >
            목록
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        {activeTab === 'form' ? (
          <TradeForm onSuccess={handleFormSuccess} />
        ) : (
          <TradeList refreshTrigger={refreshTrigger} />
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: '#333',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  splitView: {
    flex: 1,
    flexDirection: 'row',
  },
  leftPanel: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  rightPanel: {
    flex: 1,
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    backgroundColor: '#fff',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#333',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
  },
  activeTabText: {
    color: '#333',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
})