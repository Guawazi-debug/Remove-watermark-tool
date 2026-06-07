const { toolIndex } = require('../../utils/tool-meta')
const app = getApp()

const FAVORITE_TOOLS_KEY = 'favorite-tools'
const TOOL_COMBOS_KEY = 'tool-combinations'

Page({
  data: {
    activeTab: 'tools', // tools | combos
    favoriteTools: [],
    toolCombos: [],
    showComboModal: false,
    comboName: '',
    selectedTools: [],
    availableTools: [],
    showRunner: false,
    runnerCombo: null
  },

  onLoad() {
    this._loadData()
  },

  onShow() {
    this._loadData()
  },

  onTabTap(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ activeTab: tab })
  },

  // 加载数据
  _loadData() {
    const favoriteIds = wx.getStorageSync(FAVORITE_TOOLS_KEY) || []
    const favoriteTools = favoriteIds
      .map(id => toolIndex[id])
      .filter(Boolean)

    const toolCombos = (wx.getStorageSync(TOOL_COMBOS_KEY) || []).map(combo => ({
      ...combo,
      toolNames: combo.tools.map(id => toolIndex[id] ? toolIndex[id].name : id)
    }))

    // 准备可选工具列表（排除已收藏的）
    const allTools = Object.values(toolIndex)
    const availableTools = allTools.filter(tool => !favoriteIds.includes(tool.id))

    this.setData({
      favoriteTools,
      toolCombos,
      availableTools
    })
  },

  // 取消收藏工具
  onRemoveFavorite(e) {
    const toolId = e.currentTarget.dataset.id
    wx.showModal({
      title: '取消收藏',
      content: '确定要取消收藏该工具吗？',
      success: (res) => {
        if (res.confirm) {
          const current = wx.getStorageSync(FAVORITE_TOOLS_KEY) || []
          const next = current.filter(id => id !== toolId)
          wx.setStorageSync(FAVORITE_TOOLS_KEY, next)
          this._loadData()
          wx.showToast({ title: '已取消收藏', icon: 'success' })
        }
      }
    })
  },

  // 工具卡片点击
  onToolTap(e) {
    // 防止重复点击
    if (this._isNavigating) return
    this._isNavigating = true

    const page = e.currentTarget.dataset.page
    const toolId = e.currentTarget.dataset.toolId
    this._recordUseCount()
    // 记录到服务器
    if (toolId) {
      app.trackToolUse(toolId)
    }
    wx.navigateTo({
      url: page,
      complete: () => {
        setTimeout(() => {
          this._isNavigating = false
        }, 300)
      }
    })
  },

  // 记录使用次数
  _recordUseCount() {
    const stats = wx.getStorageSync('user-stats') || {
      totalUseCount: 0,
      firstUseDate: new Date().toISOString().split('T')[0]
    }
    stats.totalUseCount = (stats.totalUseCount || 0) + 1
    stats.lastUseDate = new Date().toISOString().split('T')[0]
    wx.setStorageSync('user-stats', stats)
  },

  // 显示创建组合弹窗
  onShowComboModal() {
    // 给每个工具添加selected属性
    const availableTools = this.data.availableTools.map(tool => ({
      ...tool,
      selected: false
    }))
    this.setData({
      showComboModal: true,
      comboName: '',
      selectedTools: [],
      availableTools
    })
  },

  // 隐藏弹窗
  onHideComboModal() {
    this.setData({
      showComboModal: false,
      comboName: '',
      selectedTools: []
    })
  },

  // 输入组合名称
  onComboNameInput(e) {
    this.setData({ comboName: e.detail.value })
  },

  // 选择/取消选择工具
  onToggleTool(e) {
    const toolId = e.currentTarget.dataset.id
    const tool = toolIndex[toolId]
    if (!tool) return

    const selected = [...this.data.selectedTools]
    const index = selected.findIndex(t => t.id === toolId)

    if (index > -1) {
      // 取消选择
      selected.splice(index, 1)
    } else {
      // 选择
      if (selected.length >= 3) {
        wx.showToast({ title: '最多选择3个工具', icon: 'none' })
        return
      }
      selected.push(tool)
    }

    // 更新availableTools中每个工具的selected状态
    const availableTools = this.data.availableTools.map(t => ({
      ...t,
      selected: selected.some(s => s.id === t.id)
    }))

    this.setData({
      selectedTools: selected,
      availableTools
    })
  },

  // 保存组合
  onSaveCombo() {
    const { comboName, selectedTools } = this.data

    if (!comboName.trim()) {
      wx.showToast({ title: '请输入组合名称', icon: 'none' })
      return
    }

    if (selectedTools.length < 2) {
      wx.showToast({ title: '请至少选择2个工具', icon: 'none' })
      return
    }

    const combo = {
      id: 'combo-' + Date.now(),
      name: comboName.trim(),
      tools: selectedTools.map(t => t.id),
      createTime: new Date().toISOString()
    }

    const combos = wx.getStorageSync(TOOL_COMBOS_KEY) || []
    combos.unshift(combo)
    wx.setStorageSync(TOOL_COMBOS_KEY, combos)

    this.setData({ showComboModal: false })
    this._loadData()
    wx.showToast({ title: '创建成功', icon: 'success' })
  },

  // 执行组合
  onRunCombo(e) {
    const comboId = e.currentTarget.dataset.id
    const combos = wx.getStorageSync(TOOL_COMBOS_KEY) || []
    const combo = combos.find(c => c.id === comboId)
    if (!combo || combo.tools.length === 0) return

    // 准备工具详情
    const toolDetails = combo.tools.map(id => toolIndex[id]).filter(Boolean)

    // 将组合信息和当前索引存入缓存
    const comboData = {
      id: combo.id,
      name: combo.name,
      tools: combo.tools,
      currentIndex: 0
    }
    wx.setStorageSync('current-combo', comboData)

    this.setData({
      showComboModal: false,
      showRunner: true,
      runnerCombo: {
        ...combo,
        toolDetails,
        currentIndex: 0,
        currentTool: toolDetails[0]
      }
    })
    this._loadData()
  },

  // 执行组合中的下一个工具
  onNextTool() {
    const { runnerCombo } = this.data
    if (!runnerCombo) return

    const nextIndex = runnerCombo.currentIndex + 1
    if (nextIndex >= runnerCombo.toolDetails.length) {
      wx.showToast({ title: '组合执行完成', icon: 'success' })
      this.setData({ showRunner: false, runnerCombo: null })
      wx.removeStorageSync('current-combo')
      this._loadData()
      return
    }

    const comboData = {
      id: runnerCombo.id,
      name: runnerCombo.name,
      tools: runnerCombo.tools,
      currentIndex: nextIndex
    }
    wx.setStorageSync('current-combo', comboData)

    this.setData({
      'runnerCombo.currentIndex': nextIndex,
      'runnerCombo.currentTool': runnerCombo.toolDetails[nextIndex]
    })
  },

  // 关闭执行面板
  onCloseRunner() {
    wx.showModal({
      title: '结束执行',
      content: '确定要结束当前组合执行吗？',
      success: (res) => {
        if (res.confirm) {
          this.setData({ showRunner: false, runnerCombo: null })
          wx.removeStorageSync('current-combo')
          this._loadData()
        }
      }
    })
  },

  // 打开当前工具
  onOpenTool(e) {
    const page = e.currentTarget.dataset.page
    wx.navigateTo({ url: page })
  },

  // 删除组合
  onDeleteCombo(e) {
    const comboId = e.currentTarget.dataset.id
    wx.showModal({
      title: '删除组合',
      content: '确定要删除该工具组合吗？',
      success: (res) => {
        if (res.confirm) {
          const combos = wx.getStorageSync(TOOL_COMBOS_KEY) || []
          const next = combos.filter(c => c.id !== comboId)
          wx.setStorageSync(TOOL_COMBOS_KEY, next)
          this._loadData()
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  },

  // 获取工具名称
  _getToolName(toolId) {
    const tool = toolIndex[toolId]
    return tool ? tool.name : toolId
  }
})
