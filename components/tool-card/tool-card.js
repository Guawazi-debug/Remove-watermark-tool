Component({
  options: {
    virtualHost: true
  },
  properties: {
    toolId: { type: String, value: '' },
    page: { type: String, value: '' },
    icon: { type: String, value: '' },
    name: { type: String, value: '' },
    desc: { type: String, value: '' },
    badge: {
      type: String,
      optionalTypes: [null],
      value: ''
    },
    category: { type: String, value: '' },
    color: { type: String, value: '#4a90d9' },
    isFavorite: { type: Boolean, value: false }
  },
  methods: {
    onTap() {
      this.triggerEvent('tap', {
        toolId: this.properties.toolId,
        page: this.properties.page
      })
    },
    onFavoriteTap(e) {
      // 阻止事件冒泡
      this.triggerEvent('favorite', { toolId: this.properties.toolId })
    }
  }
})
