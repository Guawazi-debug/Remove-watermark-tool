// utils/share.js
// 通用分享配置

const APP_NAME = '工具小栈'

/**
 * 生成页面分享配置
 * @param {string} title - 分享标题
 * @param {string} path - 分享路径
 * @returns {object} onShareAppMessage 配置
 */
function getShareAppMessage(title, path) {
  return {
    title: title ? `${title} - ${APP_NAME}` : APP_NAME,
    path: path || '/pages/index/index'
  }
}

/**
 * 生成朋友圈分享配置
 * @param {string} title - 分享标题
 * @returns {object} onShareTimeline 配置
 */
function getShareTimeline(title) {
  return {
    title: title ? `${title} - ${APP_NAME}` : APP_NAME
  }
}

module.exports = {
  getShareAppMessage,
  getShareTimeline
}
