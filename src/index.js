import {Observable as O} from "rx"
import TSERS from "@tsers/core"
import ReactDOM from "@tsers/react"
import Model, {R} from "@tsers/model"

import TodoMVC from "./App"
import {genId} from "./util"


TSERS(TodoMVC, {
  DOM: ReactDOM("#app"),
  model$: Model({
    items: R.times(i => ({id: genId(), text: "Todo " + i, completed: false}), 2000),
    filter: ""
  }),
  hash$: HashListener
})


function HashListener() {
  const singal$ = O.fromEvent(window, "hashchange")
    .map(() => window.location.hash)
    .startWith(window.location.hash)
    .map(h => (h || "").replace(/^#\/?/g, ""))
    .replay(null, 1)

  const dispose = singal$.connect()
  const executor = () => dispose
  return [singal$, executor]
}
