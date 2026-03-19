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
import { useAdmin } from '../_layout'

export default function App() {
    const [activeTab, setActiveTab] = useState<'form' | 'list'>('form')
    const [refreshTrigger, setRefreshTrigger] = useState(0)
    const { width } = useWindowDimensions()
    const isLargeScreen = width >= 768
    const { isAdmin } = useAdmin()

    const handleFormSuccess = () => {
        setRefreshTrigger((prev) => prev + 1)
        if (isLargeScreen) {
        } else {
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
                        {isAdmin && <TradeForm onSuccess={handleFormSuccess} />}  {/* 변경 */}
                    </View>
                    <View style={styles.rightPanel}>
                        <TradeList refreshTrigger={refreshTrigger} isAdmin={isAdmin} />  {/* 변경 */}
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
            {isAdmin && (  // 추가: 어드민일 때만 탭 표시
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'form' && styles.activeTab]}
                        onPress={() => setActiveTab('form')}
                    >
                        <Text style={[styles.tabText, activeTab === 'form' && styles.activeTabText]}>
                            등록
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'list' && styles.activeTab]}
                        onPress={() => setActiveTab('list')}
                    >
                        <Text style={[styles.tabText, activeTab === 'list' && styles.activeTabText]}>
                            목록
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
            <View style={styles.content}>
                {isAdmin && activeTab === 'form' ? (
                    <TradeForm onSuccess={handleFormSuccess} />
                ) : (
                    <TradeList refreshTrigger={refreshTrigger} isAdmin={isAdmin} />
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