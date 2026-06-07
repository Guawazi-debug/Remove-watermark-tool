/**
 * 公共工具函数
 * 用于存放各页面共用的方法
 */

/**
 * 记录使用次数
 * 用于统计用户使用工具的总次数
 */
function recordUseCount() {
  const stats = wx.getStorageSync('user-stats') || {
    totalUseCount: 0,
    firstUseDate: new Date().toISOString().split('T')[0]
  }
  stats.totalUseCount = (stats.totalUseCount || 0) + 1
  stats.lastUseDate = new Date().toISOString().split('T')[0]
  wx.setStorageSync('user-stats', stats)
}

/**
 * 记录最近使用的工具
 * @param {string} toolId - 工具ID
 * @param {number} maxCount - 最大记录数量，默认6
 */
function recordRecentTool(toolId, maxCount = 6) {
  const current = wx.getStorageSync('recent-tools') || []
  const next = [toolId].concat(current.filter(id => id !== toolId)).slice(0, maxCount)
  wx.setStorageSync('recent-tools', next)
}

/**
 * 防重复点击
 * @param {Object} page - 页面实例
 * @param {number} delay - 延迟时间（毫秒），默认300
 * @returns {boolean} - 是否允许点击
 */
function preventDuplicateTap(page, delay = 300) {
  if (page._isNavigating) return false
  page._isNavigating = true
  setTimeout(() => {
    page._isNavigating = false
  }, delay)
  return true
}

module.exports = {
  recordUseCount,
  recordRecentTool,
  preventDuplicateTap
}
