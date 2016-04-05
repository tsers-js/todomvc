import {Observable as O} from "rx"
import TSERS from "@tsers/core"
import Snabbdom from "@tsers/snabbdom"
import Model, {R} from "@tsers/model"

import TodoMVC from "./components/App"
import {genId} from "./util"


TSERS(TodoMVC, {
  DOM: Snabbdom("#app"),
  model$: Model({
    items: [
      {id: genId(), text: "TSERS!", completed: false}
    ],
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
