import {Observable as O} from "rx"
import {genId, ENTER_KEY, ESC_KEY} from "../util"

export default function main(signals) {
  const {DOM, model$, mux} = signals
  const {L} = model$
  const {h} = DOM

  const items$ = model$.lens("items")
  const draft$ = model$.lens(L("draft", L.defaults("")))

  const vdom$ = DOM.prepare(draft$.map(draft =>
    h("header.header", [
      h("h1", "todos"),
      h("input.new-todo", {
        type: "text",
        value: draft,
        attributes: {placeholder: "What needs to be done?"},
        autoFocus: true
      })
    ])))

  const addItem$ = DOM.events(vdom$, ".new-todo", "keydown")
    .withLatestFrom(draft$, (e, draft) => ({e, draft}))
    .filter(({e, draft}) => draft.trim() && e.keyCode == ENTER_KEY)
    .map(({draft}) => items => [...items, {id: genId(), text: draft, completed: false}])
    .share()

  const reset$ = DOM.events(vdom$, ".new-todo", "keydown")
    .filter(e => e.keyCode === ESC_KEY)
    .merge(addItem$)

  const mod$ = O.merge(
    draft$.set(DOM.events(vdom$, ".new-todo", "input").map(e => e.target.value)),
    draft$.set(reset$.map(() => "")),
    items$.mod(addItem$)
  )

  return mux({
    DOM: vdom$,
    model$: mod$
  })
}
