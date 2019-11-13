import { FluentBundle } from '@fluent/bundle'
import { Vue } from 'vue/types/vue'
import FluentVue from './fluent-vue'
import { isPlainObject } from './util/object'

function getParentFluent(comp: Vue) {
  const options = comp.$options

  if (options.parent && options.parent.$fluent && options.parent.$fluent instanceof FluentVue) {
    return options.parent.$fluent
  } else {
    return null
  }
}

export default {
  beforeCreate(this: Vue): void {
    const options = this.$options

    const parentFluent = getParentFluent(this)

    if (options.fluent) {
      if (options.fluent instanceof FluentVue) {
        this._fluent = options.fluent
      } else if (isPlainObject(options.fluent)) {
        if (parentFluent == null) {
          throw new Error('Fluent option is not found in parent component')
        } else {
          this._fluent = new FluentVue(parentFluent, options.fluent)
        }
      }
    } else if (parentFluent != null) {
      this._fluent = parentFluent
    }

    if (!this._fluent) {
      return
    }

    this._fluent.subscribe(this)
  },

  beforeDestroy(this: Vue): void {
    if (!this._fluent) {
      return
    }

    this._fluent.unsubscribe(this)

    this.$nextTick(() => {
      this._fluent = undefined
    })
  }
}
