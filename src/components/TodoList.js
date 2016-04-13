import {Observable as O} from "@tsers/rxjs"
import Item from "./TodoItem"

export default function main(signals) {
  const {DOM, model$, mux, demuxCombined} = signals
  const {h} = DOM

  const items$ = model$.lens("items")
  const filter$ = model$.lens("filter")
  const allCompleted$ = model$.map(m => m.allCompleted)



  const children$$ = items$.mapListById((id, item$) => {
    const removeMod$ = items$.mod(O.of(items => items.filter(it => it.id !== id)))
    return Item({...signals, id, model$: item$, filter$, removeMod$})
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
