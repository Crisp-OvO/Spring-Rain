import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';

import { RootState } from '../store';
import { updateApiConfig, updateAppConfig, toggleDeveloperMode } from '../store/slices/settingsSlice';
import { updatePreferences } from '../store/slices/userSlice';
import { SOLVE_METHOD_LABELS } from '../constants/config';

const SettingsScreen: React.FC = () => {
  const dispatch = useDispatch();
  const { apiConfig, appConfig, developerMode } = useSelector((state: RootState) => state.settings);
  const { preferences } = useSelector((state: RootState) => state.user);
  
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(apiConfig.qwenMathApiKey);

  // 处理API密钥设置
  const handleSaveApiKey = () => {
    if (tempApiKey.trim()) {
      dispatch(updateApiConfig({ qwenMathApiKey: tempApiKey.trim() }));
      Alert.alert('成功', 'API密钥已保存');
    } else {
      Alert.alert('错误', '请输入有效的API密钥');
    }
    setShowApiKeyModal(false);
  };

  // 设置项组件
  const SettingItem = ({ 
    title, 
    subtitle, 
    icon, 
    onPress, 
    showArrow = true,
    rightComponent 
  }: {
    title: string;
    subtitle?: string;
    icon: string;
    onPress?: () => void;
    showArrow?: boolean;
    rightComponent?: React.ReactNode;
  }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <Icon name={icon} size={24} color="#6366f1" />
        <View style={styles.settingText}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.settingRight}>
        {rightComponent}
        {showArrow && onPress && (
          <Icon name="chevron-forward" size={20} color="#9ca3af" />
        )}
      </View>
    </TouchableOpacity>
  );

  // 切换开关组件
  const SwitchItem = ({ 
    title, 
    subtitle, 
    icon, 
    value, 
    onValueChange 
  }: {
    title: string;
    subtitle?: string;
    icon: string;
    value: boolean;
    onValueChange: (value: boolean) => void;
  }) => (
    <SettingItem
      title={title}
      subtitle={subtitle}
      icon={icon}
      showArrow={false}
      rightComponent={
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#f3f4f6', true: '#c7d2fe' }}
          thumbColor={value ? '#6366f1' : '#9ca3af'}
        />
      }
    />
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>设置</Text>
        <Text style={styles.subtitle}>个人偏好和应用配置</Text>
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 模型配置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>模型配置</Text>
          
          <SettingItem
            title="API密钥"
            subtitle={apiConfig.qwenMathApiKey ? '已配置' : '未配置'}
            icon="key"
            onPress={() => setShowApiKeyModal(true)}
          />
          
          <SettingItem
            title="数学推理模型"
            subtitle="Qwen-Plus-2025-04-28"
            icon="calculator"
            onPress={() => {}}
          />
          
          <SettingItem
            title="OCR识别模型"
            subtitle="Qwen-VL-Max"
            icon="scan"
            onPress={() => {}}
          />
          
          <SettingItem
            title="服务器地址"
            subtitle={apiConfig.baseUrl}
            icon="server"
            onPress={() => {}}
          />
        </View>
        
        {/* 应用设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>应用设置</Text>
          
          <SettingItem
            title="主题模式"
            subtitle={preferences.theme === 'light' ? '浅色' : preferences.theme === 'dark' ? '深色' : '跟随系统'}
            icon="color-palette"
            onPress={() => {
              Alert.alert(
                '选择主题',
                '',
                [
                  { text: '浅色', onPress: () => dispatch(updatePreferences({ theme: 'light' })) },
                  { text: '深色', onPress: () => dispatch(updatePreferences({ theme: 'dark' })) },
                  { text: '跟随系统', onPress: () => dispatch(updatePreferences({ theme: 'system' })) },
                  { text: '取消', style: 'cancel' },
                ]
              );
            }}
          />
          
          <SettingItem
            title="语言"
            subtitle="简体中文"
            icon="language"
            onPress={() => {}}
          />
          
          <SettingItem
            title="字体大小"
            subtitle={appConfig.fontSize === 'small' ? '小' : appConfig.fontSize === 'large' ? '大' : '中'}
            icon="text"
            onPress={() => {
              Alert.alert(
                '选择字体大小',
                '',
                [
                  { text: '小', onPress: () => dispatch(updateAppConfig({ fontSize: 'small' })) },
                  { text: '中', onPress: () => dispatch(updateAppConfig({ fontSize: 'medium' })) },
                  { text: '大', onPress: () => dispatch(updateAppConfig({ fontSize: 'large' })) },
                  { text: '取消', style: 'cancel' },
                ]
              );
            }}
          />
        </View>

        {/* 功能设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>功能设置</Text>
          
          <SwitchItem
            title="推送通知"
            subtitle="接收解题完成和错误提醒"
            icon="notifications"
            value={preferences.notificationsEnabled}
            onValueChange={(value) => dispatch(updatePreferences({ notificationsEnabled: value }))}
          />
          
          <SwitchItem
            title="云端同步"
            subtitle="自动同步解题历史到云端"
            icon="cloud"
            value={preferences.syncEnabled}
            onValueChange={(value) => dispatch(updatePreferences({ syncEnabled: value }))}
          />
          
          <SwitchItem
            title="自动保存"
            subtitle="自动保存解题记录"
            icon="save"
            value={appConfig.autoSave}
            onValueChange={(value) => dispatch(updateAppConfig({ autoSave: value }))}
          />
          
          <SwitchItem
            title="离线模式"
            subtitle="启用离线数学计算功能"
            icon="airplane"
            value={appConfig.offlineMode}
            onValueChange={(value) => dispatch(updateAppConfig({ offlineMode: value }))}
          />
        </View>

        {/* OCR设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OCR设置</Text>
          
          <SwitchItem
            title="自动纠错"
            subtitle="自动修正识别错误"
            icon="checkmark-circle"
            value={preferences.ocr.autoCorrect}
            onValueChange={(value) => 
              dispatch(updatePreferences({ 
                ocr: { ...preferences.ocr, autoCorrect: value } 
              }))
            }
          />
          
          <SwitchItem
            title="高精度模式"
            subtitle="使用更高精度的识别算法"
            icon="eye"
            value={preferences.ocr.highAccuracyMode}
            onValueChange={(value) => 
              dispatch(updatePreferences({ 
                ocr: { ...preferences.ocr, highAccuracyMode: value } 
              }))
            }
          />
        </View>

        {/* 解题设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>解题设置</Text>
          
          <SwitchItem
            title="显示解题步骤"
            subtitle="显示详细的解题过程"
            icon="list"
            value={preferences.solver.showSteps}
            onValueChange={(value) => 
              dispatch(updatePreferences({ 
                solver: { ...preferences.solver, showSteps: value } 
              }))
            }
          />
          
          <SwitchItem
            title="详细解释"
            subtitle="提供详细的数学概念解释"
            icon="information-circle"
            value={preferences.solver.detailedExplanation}
            onValueChange={(value) => 
              dispatch(updatePreferences({ 
                solver: { ...preferences.solver, detailedExplanation: value } 
              }))
            }
          />
          
          <SettingItem
            title="数学格式"
            subtitle={preferences.solver.mathFormat === 'latex' ? 'LaTeX' : '普通'}
            icon="formula"
            onPress={() => {
              Alert.alert(
                '选择数学格式',
                '',
                [
                  { text: '普通', onPress: () => dispatch(updatePreferences({ 
                    solver: { ...preferences.solver, mathFormat: 'normal' } 
                  })) },
                  { text: 'LaTeX', onPress: () => dispatch(updatePreferences({ 
                    solver: { ...preferences.solver, mathFormat: 'latex' } 
                  })) },
                  { text: '取消', style: 'cancel' },
                ]
              );
            }}
          />
        </View>

        {/* 隐私设置 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>隐私设置</Text>
          
          <SwitchItem
            title="保存历史记录"
            subtitle="在设备上保存解题历史"
            icon="time"
            value={preferences.privacy.saveHistory}
            onValueChange={(value) => 
              dispatch(updatePreferences({ 
                privacy: { ...preferences.privacy, saveHistory: value } 
              }))
            }
          />
          
          <SwitchItem
            title="数据共享"
            subtitle="匿名分享数据以改进服务"
            icon="share"
            value={preferences.privacy.shareData}
            onValueChange={(value) => 
              dispatch(updatePreferences({ 
                privacy: { ...preferences.privacy, shareData: value } 
              }))
            }
          />
        </View>

        {/* 开发者选项 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>开发者选项</Text>
          
          <SwitchItem
            title="开发者模式"
            subtitle="启用高级调试功能"
            icon="bug"
            value={developerMode}
            onValueChange={() => dispatch(toggleDeveloperMode())}
          />
          
          {developerMode && (
            <>
              <SettingItem
                title="查看日志"
                subtitle="查看应用运行日志"
                icon="document-text"
                onPress={() => Alert.alert('提示', '日志查看功能开发中')}
              />
              
              <SettingItem
                title="清除缓存"
                subtitle="清除所有应用缓存"
                icon="trash"
                onPress={() => {
                  Alert.alert(
                    '确认清除',
                    '确定要清除所有缓存吗？',
                    [
                      { text: '取消', style: 'cancel' },
                      { text: '清除', style: 'destructive', onPress: () => {
                        Alert.alert('成功', '缓存已清除');
                      }},
                    ]
                  );
                }}
              />
            </>
          )}
        </View>

        {/* 关于 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>关于</Text>
          
          <SettingItem
            title="应用版本"
            subtitle="v2.0.0"
            icon="information"
            showArrow={false}
          />
          
          <SettingItem
            title="检查更新"
            subtitle="查找新版本"
            icon="refresh"
            onPress={() => Alert.alert('提示', '当前已是最新版本')}
          />
          
          <SettingItem
            title="用户协议"
            subtitle="查看服务条款"
            icon="document"
            onPress={() => {}}
          />
          
          <SettingItem
            title="隐私政策"
            subtitle="了解隐私保护"
            icon="shield"
            onPress={() => {}}
          />
        </View>
      </ScrollView>

      {/* API密钥设置模态框 */}
      <Modal
        visible={showApiKeyModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowApiKeyModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>设置API密钥</Text>
              <TouchableOpacity onPress={() => setShowApiKeyModal(false)}>
                <Icon name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalDescription}>
              请输入您的阿里云百炼平台API密钥，用于调用Qwen模型服务。
            </Text>
            
            <TextInput
              style={styles.apiKeyInput}
              value={tempApiKey}
              onChangeText={setTempApiKey}
              placeholder="请输入API密钥"
              secureTextEntry={true}
              multiline={true}
              numberOfLines={3}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowApiKeyModal(false)}
              >
                <Text style={styles.cancelButtonText}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSaveApiKey}
              >
                <Text style={styles.saveButtonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: 'white',
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  modalDescription: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 16,
  },
  apiKeyInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '500',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default SettingsScreen; 