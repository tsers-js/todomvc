import {Observable as O} from "rx"
import Item from "./TodoItem"

export default function main(signals) {
  const {DOM, model$, mux, demuxCombined} = signals
  const {h} = DOM

  const items$ = model$.lens("items")
  const allCompleted$ = model$.map(m => m.allCompleted)

  const children$$ = items$.mapListById((id, item$) => {
    const removeMod$ = items$.mod(O.just(items => items.filter(it => it.id !== id)))
    return Item({...signals, id, model$: item$, removeMod$})
  })

  const [{DOM: itemsDOM$}, out$] = demuxCombined(children$$, "DOM")

  const vdom$ = DOM.prepare(O.combineLatest(allCompleted$, itemsDOM$,
    (allCompleted, items) =>
      h("section.main", [
        items.length ? h("input.toggle-all", {type: "checkbox", checked: allCompleted}) : null,
        h("ul.todo-list", items)
      ])))

  const mod$ = items$.mod(
    allCompleted$.sample(DOM.events(vdom$, ".toggle-all", "change")).map(toggleAll)
  )

  return mux({DOM: vdom$, model$: mod$}, out$)
}

function toggleAll(currentlyAllCompleted) {
  return items => items.map(it => ({
    ...it,
    completed: !currentlyAllCompleted
  }))
}
