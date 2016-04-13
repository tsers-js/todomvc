import {Observable as O} from "@tsers/rxjs"
import {R} from "@tsers/model"
import List from "./TodoList"
import Header from "./Header"
import Footer from "./Footer"

export default function main(signals) {
  const {DOM, model$: M, mux, hash$, demux} = signals
  const {L} = M
  const {h} = DOM

  const model$ = M.lens(L(
    L.augment({
      itemsLeft: ({items}) => items.filter(R.whereEq({completed: false})).length
    }),
    L.augment({
      allCompleted: ({itemsLeft}) => itemsLeft === 0,
      completedCount: ({items, itemsLeft}) => items.length - itemsLeft
    })
  ))

  const [{DOM: listDOM$}, lOut$] = demux(List({...signals, model$}), "DOM")
  const [{DOM: headerDOM$}, hOut$] = demux(Header({...signals, model$}), "DOM")
  const [{DOM: footerDOM$}, fOut$] = demux(Footer({...signals, model$}), "DOM")
  const out$ = O.merge(lOut$, hOut$, fOut$)

  const vdom$ = DOM.prepare(O.combineLatest(listDOM$, headerDOM$, footerDOM$,
    (list, header, footer) =>
      h("div.todoapp", [
        header, list, footer
      ])))

  const mod$ = M.lens("filter").set(hash$)

  return mux({
    DOM: vdom$,
    model$: mod$
  }, out$)
}
