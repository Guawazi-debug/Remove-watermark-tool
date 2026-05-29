Component({
  options: {
    virtualHost: true
  },
  properties: {
    toolId: { type: String, value: '' },
    icon: { type: String, value: '' },
    name: { type: String, value: '' },
    desc: { type: String, value: '' },
    badge: {
      type: String,
      optionalTypes: [null],
      value: ''
    },
    category: { type: String, value: '' },
    color: { type: String, value: '#4a90d9' }
  },
  methods: {
    onTap() {
      this.triggerEvent('tap')
    }
  }
})
