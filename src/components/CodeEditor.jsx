import { useEffect, useRef } from 'react'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'
import { defaultKeymap, indentWithTab } from '@codemirror/commands'
import { closeBrackets } from '@codemirror/autocomplete'
import { indentOnInput, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language'

export default function CodeEditor({ value, onChange, readOnly = false }) {
  const containerRef = useRef(null)
  const viewRef = useRef(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    if (!containerRef.current) return

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged && onChangeRef.current) {
        onChangeRef.current(update.state.doc.toString())
      }
    })

    const state = EditorState.create({
      doc: value ?? '',
      extensions: [
        lineNumbers(),
        javascript(),
        oneDark,
        closeBrackets(),
        indentOnInput(),
        syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
        keymap.of([indentWithTab, ...defaultKeymap]),
        EditorView.editable.of(!readOnly),
        updateListener,
        EditorView.theme({
          '&': { minHeight: '400px', fontSize: '14px', fontFamily: 'Consolas, "Courier New", monospace' },
          '.cm-content': { padding: '8px 0' },
          '.cm-line': { paddingLeft: '8px' },
          '.cm-scroller': { overflow: 'auto', flexGrow: 1 },
        }),
      ],
    })

    const view = new EditorView({ state, parent: containerRef.current })
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync external value changes (e.g. reset)
  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value ?? '' },
      })
    }
  }, [value])

  return (
    <div
      ref={containerRef}
      style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}
    />
  )
}
