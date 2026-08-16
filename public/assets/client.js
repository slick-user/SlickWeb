(function () {
  'use strict'

  document.addEventListener('click', function (e) {
    var btn = e.target && e.target.closest ? e.target.closest('.notes-tab') : null
    if (!btn) return
    var tabs = document.querySelectorAll('.notes-tab')
    for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active')
    btn.classList.add('active')
  })

  var LANG_ALIASES = {
    sh: 'bash',
    shell: 'bash',
    bashsession: 'bash',
    py: 'python',
    js: 'javascript',
    jsx: 'javascript',
    html: 'markup',
    xml: 'markup',
    svg: 'markup',
    htm: 'markup',
    cpp: 'c',
    'c++': 'c'
  }

  function normalizeLangs(root) {
    var codeEls = root.querySelectorAll('pre code[class*="language-"]')
    for (var i = 0; i < codeEls.length; i++) {
      var el = codeEls[i]
      var m = /\blanguage-([\w-]+)/.exec(el.className)
      if (!m) continue
      var alias = LANG_ALIASES[m[1].toLowerCase()]
      if (alias && el.className.indexOf('language-' + alias) === -1) {
        el.className = el.className.replace(m[0], 'language-' + alias)
      }
    }
  }

  function slugify(text) {
    return String(text)
      .toLowerCase()
      .replace(/['"]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'section'
  }

  function uniqueId(article, base) {
    var id = base
    var i = 1
    while (article.querySelector('#' + CSS.escape(id))) {
      id = base + '-' + i
      i++
    }
    return id
  }

  function addHeadingAnchors(article) {
    var heads = article.querySelectorAll('h2, h3')
    for (var i = 0; i < heads.length; i++) {
      var h = heads[i]
      if (h.querySelector('.heading-anchor')) continue
      h.id = uniqueId(article, slugify(h.textContent))
      var a = document.createElement('a')
      a.className = 'heading-anchor'
      a.href = '#' + h.id
      a.setAttribute('aria-hidden', 'true')
      a.textContent = '#'
      h.appendChild(a)
    }
  }

  function buildToc(article) {
    var old = article.querySelector('.note-toc')
    if (old) old.remove()

    var heads = article.querySelectorAll('h2, h3')
    if (!heads.length) return

    var nav = document.createElement('nav')
    nav.className = 'note-toc'
    var title = document.createElement('p')
    title.className = 'note-toc-title'
    title.textContent = 'Contents'
    nav.appendChild(title)

    var ul = document.createElement('ul')
    for (var i = 0; i < heads.length; i++) {
      var h = heads[i]
      var li = document.createElement('li')
      li.className = h.tagName === 'H2' ? 'toc-l2' : 'toc-l3'
      var a = document.createElement('a')
      a.href = '#' + h.id
      a.textContent = h.textContent.replace(/#$/, '').trim()
      li.appendChild(a)
      ul.appendChild(li)
    }
    nav.appendChild(ul)

    var h1 = article.querySelector('h1')
    if (h1 && h1.nextSibling) {
      article.insertBefore(nav, h1.nextSibling)
    } else {
      article.insertBefore(nav, article.firstChild)
    }
  }

  function addCopyButtons(article) {
    var pres = article.querySelectorAll('pre')
    for (var i = 0; i < pres.length; i++) {
      var pre = pres[i]
      if (pre.parentNode && pre.parentNode.classList.contains('code-block')) continue

      var wrap = document.createElement('div')
      wrap.className = 'code-block'
      var btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'copy-btn'
      btn.textContent = 'Copy'

      pre.parentNode.insertBefore(wrap, pre)
      wrap.appendChild(pre)
      wrap.insertBefore(btn, pre)

      btn.addEventListener('click', function () {
        var code = this.parentNode.querySelector('code') || this.parentNode.querySelector('pre')
        var text = (code.textContent || '').replace(/\n+$/, '').trim()
        var done = function () {
          this.textContent = 'Copied!'
          var self = this
          setTimeout(function () { self.textContent = 'Copy' }, 1500)
        }.bind(this)
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(function () { fallbackCopy(text); done() })
        } else {
          fallbackCopy(text)
          done()
        }
      })
    }
  }

  function fallbackCopy(text) {
    var ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    try { document.execCommand('copy') } catch (e) { /* noop */ }
    document.body.removeChild(ta)
  }

  function bindLightbox(article) {
    var imgs = article.querySelectorAll('img')
    for (var i = 0; i < imgs.length; i++) {
      var img = imgs[i]
      if (img.classList.contains('lb-bound')) continue
      img.classList.add('lb-bound')
      img.loading = 'lazy'
      img.tabIndex = 0
      img.addEventListener('click', function () { openLightbox(this) })
      img.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          openLightbox(this)
        }
      })
    }
  }

  function openLightbox(img) {
    var existing = document.querySelector('.lightbox')
    if (existing) existing.remove()

    var overlay = document.createElement('div')
    overlay.className = 'lightbox'
    var pic = document.createElement('img')
    pic.src = img.currentSrc || img.src
    pic.alt = img.alt || ''
    overlay.appendChild(pic)
    document.body.appendChild(overlay)

    function close() {
      overlay.remove()
      document.removeEventListener('keydown', onKey)
    }
    function onKey(e) {
      if (e.key === 'Escape') close()
    }
    overlay.addEventListener('click', close)
    document.addEventListener('keydown', onKey)
  }

  function decorate(article) {
    if (!article) return
    normalizeLangs(article)
    addHeadingAnchors(article)
    // buildToc(article) — TOC kept in code but unused for now
    addCopyButtons(article)
    bindLightbox(article)
    if (window.Prism) Prism.highlightAllUnder(article)
  }

  var initial = document.querySelector('.note-content')
  if (initial) decorate(initial)

  document.body.addEventListener('htmx:afterSwap', function (evt) {
    var target = evt.detail && evt.detail.target
    if (!target) return

    // Leaving a note page: any #content swap returns to the standard page layout
    if (target.id === 'content') {
      var main = target.closest('main')
      if (main) main.classList.remove('note-main')
    }

    // A note was swapped in — move the sidebar highlight to it
    if (target.id === 'note-article') {
      var newArticle = target.classList && target.classList.contains('note-content')
        ? target
        : target.querySelector ? target.querySelector('.note-content') : null
      var slug = newArticle && newArticle.getAttribute('data-slug')
      if (slug) {
        var noteLinks = document.querySelectorAll('.sidebar-note')
        for (var i = 0; i < noteLinks.length; i++) noteLinks[i].classList.remove('active')
        var activeLink = document.querySelector('.sidebar-note[href="/note/' + slug + '"]')
        if (activeLink) activeLink.classList.add('active')
      }
    }

    var article = target.classList && target.classList.contains('note-content')
      ? target
      : target.querySelector ? target.querySelector('.note-content') : null
    decorate(article)
  })
})()