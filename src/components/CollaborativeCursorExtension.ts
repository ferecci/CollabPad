import { Extension } from '@tiptap/core';
import { Decoration, DecorationSet } from 'prosemirror-view';
import { Plugin } from 'prosemirror-state';
import { EditorState } from 'prosemirror-state';
import tinycolor from 'tinycolor2';

export const CollaborativeCursorExtension = Extension.create({
  name: 'collaborativeCursor',
  addOptions() {
    return { provider: null };
  },
  addProseMirrorPlugins() {
    let deco = DecorationSet.empty;
    return [
      new Plugin({
        props: {
          decorations: (state: EditorState) => deco,
        },
        view: view => {
          const provider = this.options.provider;
          const localClientId = provider?.awareness?.clientID;
          if (!provider) return { props: {} };

          const updateDecorations = () => {
            const states = Array.from(
              provider.awareness.getStates().entries()
            ) as [any, any][];
            const decorations = [];
            for (const [clientId, state] of states) {
              if (!state || !state.user || !state.cursor) continue;
              if (clientId === localClientId) {
                continue;
              }
              const { name, color } = state.user;
              if (!state.cursor) continue;
              const { anchor, head } = state.cursor;
              const from = Math.min(anchor, head);
              const to = Math.max(anchor, head);
              if (from !== to) {
                // Use a slightly darker border for contrast
                const borderColor = tinycolor(color).darken(15).toString();
                decorations.push(
                  Decoration.inline(from, to, {
                    class: 'collab-selection',
                    style: `background: ${color}; opacity: 0.6; border-radius: 2px; border: 2px solid ${borderColor};`,
                  })
                );
              }
              decorations.push(
                Decoration.widget(
                  head,
                  () => {
                    const caret = document.createElement('span');
                    caret.className = 'collab-cursor-caret';
                    caret.style.borderLeft = `2px solid ${color}`;
                    caret.style.marginLeft = '-1px';
                    caret.style.height = '1em';
                    caret.style.position = 'relative';
                    caret.style.verticalAlign = 'text-bottom';
                    caret.style.zIndex = '10';
                    caret.style.pointerEvents = 'none';
                    const label = document.createElement('div');
                    label.className = 'collab-cursor-label';
                    label.textContent = name || 'Anonymous';
                    label.style.background = color;
                    label.style.color = '#fff';
                    label.style.fontSize = '0.75em';
                    label.style.position = 'absolute';
                    label.style.top = '-1.5em';
                    label.style.left = '0';
                    label.style.padding = '2px 6px';
                    label.style.borderRadius = '4px';
                    label.style.whiteSpace = 'nowrap';
                    label.style.userSelect = 'none';
                    label.style.pointerEvents = 'none';
                    caret.appendChild(label);
                    return caret;
                  },
                  { side: 1 }
                )
              );
            }
            deco = DecorationSet.create(view.state.doc, decorations);
            view.dispatch(view.state.tr.setMeta('addToHistory', false));
          };

          provider.awareness.on('change', updateDecorations);
          setTimeout(updateDecorations, 0);

          return {
            destroy() {
              provider.awareness.off('change', updateDecorations);
            },
          };
        },
      }),
    ];
  },
});
