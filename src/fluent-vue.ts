import Vue from 'vue'
import { CachedSyncIterable } from 'cached-iterable'
import { mapBundleSync } from '@fluent/sequence'
import { warn } from './util/warn'

import { FluentVueObject, FluentVueOptions } from './types'
import { VueConstructor } from 'vue/types/vue'
import { Pattern, FluentBundle } from '@fluent/bundle'

interface IForceUpdatable {
  $forceUpdate(): void
}

export default class FluentVue implements FluentVueObject {
  private subscribers: Map<IForceUpdatable, boolean>
  private bundlesIterable: CachedSyncIterable
  private _bundles: FluentBundle[]

  subscribe(vue: IForceUpdatable): void {
    this.subscribers.set(vue, true)
  }
  unsubscribe(vue: IForceUpdatable): void {
    this.subscribers.delete(vue)
  }

  get bundles(): FluentBundle[] {
    return this._bundles
  }

  set bundles(bundles: FluentBundle[]) {
    this._bundles = bundles
    this.bundlesIterable = CachedSyncIterable.from(this.bundles)

    for (const subscriber of this.subscribers.keys()) {
      subscriber.$forceUpdate()
    }
  }

  static install: (vue: VueConstructor<Vue>) => void

  static mergeMessages(parentBundles: FluentBundle[], childMessages: object): FluentBundle[] {
    const result: FluentBundle[] = []

    for (const parentBundle of parentBundles) {
      const childBundle = Object.entries(childMessages).find(pair =>
        parentBundle.locales.includes(pair[0])
      )

      if (childBundle != null) {
        const bundle = new FluentBundle(parentBundle.locales)
        bundle.addResource(childBundle[1])

        bundle._terms = new Map([...parentBundle._terms, ...bundle._terms])
        bundle._messages = new Map([...parentBundle._messages, ...bundle._messages])

        result.push(bundle)
      }
    }

    return result
  }

  constructor(options: FluentVueOptions | FluentVue, messages?: object) {
    this.subscribers = new Map<Vue, boolean>()

    // Child is overriding messages
    if (options instanceof FluentVue && messages != null) {
      this._bundles = FluentVue.mergeMessages(options.bundles, messages)
      this.bundlesIterable = CachedSyncIterable.from(this.bundles)

      // Subscribe to parent bundles change
      const watcher = {
        $forceUpdate: () => {
          this.bundles = FluentVue.mergeMessages(options.bundles, messages)
        }
      }
      options.subscribe(watcher)
    } else {
      this._bundles = options.bundles
      this.bundlesIterable = CachedSyncIterable.from(this.bundles)
    }
  }

  getBundle(key: string): FluentBundle {
    return mapBundleSync(this.bundlesIterable, key)
  }

  getMessage(bundle: FluentBundle | null, key: string) {
    if (bundle === null) {
      warn(`Could not find translation for key [${key}]`)
      return null
    }

    const message = bundle.getMessage(key)

    if (message === undefined) {
      warn(`Could not find translation for key [${key}]`)
      return null
    }

    return message
  }

  formatPattern(bundle: FluentBundle, message: Pattern, value?: object): string {
    const errors: string[] = []
    const formatted = bundle.formatPattern(message, value, errors)

    for (const error of errors) {
      warn(`Error when formatting: ${error}`)
    }

    return formatted
  }

  format(key: string, value?: object): string {
    const context = this.getBundle(key)
    const message = this.getMessage(context, key)

    if (message === null || message.value === null) {
      return key
    }

    return this.formatPattern(context, message.value, value)
  }

  formatAttrs(key: string, value?: object): object {
    const context = this.getBundle(key)
    const message = this.getMessage(context, key)

    if (message === null || message.value === null) {
      return {}
    }

    const result = {}
    for (const [attrName, attrValue] of Object.entries(message.attributes)) {
      ;(result as any)[attrName] = this.formatPattern(context, attrValue, value)
    }

    return result
  }
}
