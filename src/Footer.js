import {Observable as O} from "rx"
import cn from "classnames"

export default function main(signals) {
  const {DOM, model$, mux} = signals
  const {h} = DOM

  const fli = (curFilter, clz, text) => {
    const selected = curFilter === clz
    return h("li", [
      h("a", {className: cn({selected}), href: `#/${clz}`}, text)
    ])
  }

  const vdom$ = DOM.prepare(model$.map(({filter, itemsLeft, items, completedCount}) =>
    h("footer.footer", {style: {display: !items.length ? "none" : ""}}, [
      h("span.todo-count", `${itemsLeft} ${itemsLeft === 1 ? "item" : "items"} left`),
      h("ul.filters", [
        fli(filter, "", "All"),
        fli(filter, "active", "Active"),
        fli(filter, "completed", "Completed")
      ]),
      completedCount > 0 ? h("button.clear-completed", "Clear Completed") : null
    ])))

  const mod$ = model$.lens("items").mod(
    DOM.events(vdom$, ".clear-completed", "click").map(clearCompleted)
  )

  return mux({
    DOM: vdom$,
    model$: mod$
  })
}

function clearCompleted() {
  return items => items.filter(it => !it.completed)
}
