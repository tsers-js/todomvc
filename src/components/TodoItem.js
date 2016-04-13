import {Observable as O} from "@tsers/rxjs"
import cn from "classnames"

import {ENTER_KEY, ESC_KEY} from "../util"


export default function main(signals) {
  const {DOM, model$, mux, filter$, removeMod$, id} = signals
  const {h} = DOM

  const itemVisible = (it, filter) =>
  (filter === "completed" && it.completed) ||
  (filter === "active" && !it.completed) ||
  !filter

  const m1 = model$.map(x => x).publishReplay(1).refCount()

  const visible$ = O.combineLatest(m1, filter$, itemVisible).share()

  const vdom$ = DOM.prepare(O.combineLatest(m1, visible$,
    ({completed, editing, text}, visible) =>
      h("li", {key: id, className: cn({completed, editing}), style: {display: !visible ? "none" : ""}}, [
        h("input.toggle", {type: "checkbox", checked: completed}),
        h("label.view", `${text}`),
        h("input.edit", {type: "text", value: text, autofocus: editing}),
        h("button.destroy")
      ])))

  const toggle$ = DOM.events(vdom$, ".toggle", "change")
    .withLatestFrom(model$.lens("completed"), (_, completed) => !completed)

  const startEdit$ = DOM.events(vdom$, "", "dblclick")
    .do(focusOnEdit)
    .share()

  const enterDown$ = DOM.events(vdom$, ".edit", "keydown").filter(e => e.keyCode === ENTER_KEY)
  const escDown$ = DOM.events(vdom$, ".edit", "keydown").filter(e => e.keyCode === ESC_KEY)
  const editBlur$ = DOM.events(vdom$, ".edit", "blur")
  const stopEdit$ = O.merge(enterDown$, escDown$, editBlur$)

  const text$ = model$.map(m => m.text)
  const textBeforeEdit$ = text$.sample(startEdit$)
  const textAfterEdit$ = text$.sample(O.merge(enterDown$, editBlur$))

  const newText$ = DOM.events(vdom$, ".edit", "input")
    .map(e => e.target.value)
    .merge(O.combineLatest(textAfterEdit$, textBeforeEdit$,
      (after, before) => after.trim() || before))
    .merge(textBeforeEdit$.sample(escDown$))

  const mod$ = O.merge(
    model$.lens("completed").set(toggle$),
    model$.lens("editing").set(O.merge(startEdit$.mapTo(true), stopEdit$.mapTo(false))),
    model$.lens("text").set(newText$),
    // remove item if destroy button was clicked
    removeMod$.sample(DOM.events(vdom$, ".destroy", "click"))
  )

  return mux({
    DOM: vdom$,
    model$: mod$
  })
}

function focusOnEdit(e) {
  // so ugly piece of code... :-(
  let el = (e.nativeEvent || e).target
  while (el.tagName !== "LI") el = el.parentNode
  const edit = el.querySelector(".edit")
  setTimeout(() => {
    edit.setSelectionRange(edit.value.length, edit.value.length)
    edit.focus()
  }, 0)
  e.preventDefault()
}
