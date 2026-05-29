const { toolCategories: rawCategories, toolIndex: rawToolIndex } = require('../config/tool-catalog')

function normalizeRoute(route) {
  if (!route) {
    return ''
  }
  const normalized = String(route).trim()
  if (!normalized) {
    return ''
  }
  return normalized.startsWith('/') ? normalized : `/${normalized}`
}

function normalizeTool(tool) {
  if (!tool) {
    return null
  }
  const page = normalizeRoute(tool.page)
  const searchText = [tool.name, tool.desc].concat(tool.keywords || []).join(' ').toLowerCase()
  return Object.assign({}, tool, {
    badge: tool.badge || '',
    page,
    searchText
  })
}

const toolIndex = {}
Object.keys(rawToolIndex).forEach(id => {
  const normalizedTool = normalizeTool(rawToolIndex[id])
  if (normalizedTool) {
    toolIndex[id] = normalizedTool
  }
})

const toolCategories = rawCategories.map(category =>
  Object.assign({}, category, {
    tools: category.tools.map(tool => toolIndex[tool.id]).filter(Boolean)
  })
)

const routeIndex = {}
toolCategories.forEach(category => {
  category.tools.forEach(tool => {
    const enrichedTool = Object.assign({}, tool, {
      categoryId: category.id,
      categoryName: category.name,
      categoryAccent: category.accent
    })
    routeIndex[tool.page] = enrichedTool
    toolIndex[tool.id] = enrichedTool
  })
})

function findToolByRoute(route) {
  return routeIndex[normalizeRoute(route)] || null
}

module.exports = {
  toolCategories,
  toolIndex,
  findToolByRoute,
  normalizeRoute
}
