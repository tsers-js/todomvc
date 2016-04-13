import Rx, {Observable as O} from "@tsers/rxjs"
import TSERS from "@tsers/core"
import Snabbdom from "@tsers/snabbdom"
import Model, {R} from "@tsers/model"

import TodoMVC from "./components/App"
import {genId} from "./util"


TSERS(Rx, TodoMVC, {
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
    .publishReplay(1)

  const subscription = singal$.connect()
  const executor = () => subscription
  return [singal$, executor]
}
