import { createLocalVue, mount } from '@vue/test-utils'

import { FluentBundle, FluentResource } from '@fluent/bundle'
import ftl from '@fluent/dedent'

import FluentVue from '../src'

describe('child component', () => {
  let options: any
  let bundleEn: FluentBundle
  let bundleUk: FluentBundle

  beforeEach(() => {
    const localVue = createLocalVue()
    localVue.use(FluentVue)

    bundleEn = new FluentBundle('en-US')
    bundleUk = new FluentBundle('uk-UA')

    const fluent = new FluentVue({
      bundles: [bundleUk, bundleEn]
    })

    options = {
      fluent,
      localVue
    }
  })

  it('can override parent messages', () => {
    // Arrange
    bundleEn.addResource(
      new FluentResource(ftl`
      link = link text
      `)
    )

    bundleUk.addResource(
      new FluentResource(ftl`
      link = текст посилання
      `)
    )

    const child = {
      fluent: {
        'en-US': new FluentResource(ftl`
        link = child link text
        `),
        'uk-UA': new FluentResource(ftl`
        link = текст посилання з під-компонента
        `)
      } as any,
      template: `<div>{{ $t('link') }}</div>`
    }

    const component = {
      components: {
        child
      },
      template: `
      <div>
        {{ $t('link') }}
        <child></child>
      </div>`
    }

    // Act
    const mounted = mount(component, options)

    // Assert
    expect(mounted).toMatchSnapshot()

    // Change language
    options.fluent.bundles = [bundleEn, bundleUk]

    expect(mounted).toMatchSnapshot()
  })

  it('updates child language when parent language changes', () => {
    // Arrange
    bundleEn.addResource(
      new FluentResource(ftl`
      link = link text
      `)
    )

    bundleUk.addResource(
      new FluentResource(ftl`
      link = текст посилання
      `)
    )

    const child = {
      fluent: {
        'en-US': new FluentResource(ftl`
        link = child link text
        `),
        'uk-UA': new FluentResource(ftl`
        link = текст посилання з під-компонента
        `)
      } as any,
      template: `<div>{{ $t('link') }}</div>`
    }

    const component = {
      components: {
        child
      },
      template: `
      <div>
        {{ $t('link') }}
        <child></child>
      </div>`
    }

    // Act
    const mounted = mount(component, options)

    // Assert
    expect(mounted).toMatchSnapshot()

    // Change language
    options.fluent.bundles = [bundleEn, bundleUk]

    expect(mounted).toMatchSnapshot()
  })

  it('updates grandchild language when parent language changes', () => {
    // Arrange
    bundleEn.addResource(
      new FluentResource(ftl`
      link = link text
      `)
    )

    bundleUk.addResource(
      new FluentResource(ftl`
      link = текст посилання
      `)
    )

    const grandChild = {
      fluent: {
        'en-US': new FluentResource(ftl`
        link = grandchild link text
        `),
        'uk-UA': new FluentResource(ftl`
        link = текст посилання з під-під-компонента
        `)
      } as any,
      template: `<div>{{ $t('link') }}</div>`
    }

    const child = {
      components: {
        grandChild
      },
      fluent: {
        'en-US': new FluentResource(ftl`
        link = child link text
        `),
        'uk-UA': new FluentResource(ftl`
        link = текст посилання з під-компонента
        `)
      } as any,
      template: `
      <div>
        <div>{{ $t('link') }}</div>
        <grand-child></grand-child>
      </div>`
    }

    const component = {
      components: {
        child
      },
      template: `
      <div>
        {{ $t('link') }}
        <child></child>
      </div>`
    }

    // Act
    const mounted = mount(component, options)

    // Assert
    expect(mounted).toMatchSnapshot()

    // Change language
    options.fluent.bundles = [bundleEn, bundleUk]
    expect(mounted).toMatchSnapshot()
  })
})
