// Faux client Supabase pour les tests (jamais importé par l'application).
//
// `from(table)` renvoie une chaîne qui enregistre chaque méthode appelée
// (select, eq, order...) et que l'on peut attendre avec `await`, comme la
// vraie. Le résultat est celui qu'on a programmé avec `queue(table, result)`
// (file par table, un résultat par appel de `from`), ou { data: null,
// error: null } à défaut. Rien n'est envoyé nulle part.
export function createFakeSupabase() {
  const queues = new Map()
  const rpcQueue = []
  const removed = []
  const state = {
    calls: [], // { table, ops: [[méthode, args], ...] }
    rpcCalls: [], // { name, args }
    session: { user: { id: 'user-1' } },
    inFlight: 0,
    maxInFlight: 0,
  }

  function nextResult(table) {
    const queue = queues.get(table)
    return queue && queue.length > 0 ? queue.shift() : { data: null, error: null }
  }

  function chain(table) {
    const call = { table, ops: [] }
    state.calls.push(call)
    const result = nextResult(table)
    state.inFlight += 1
    state.maxInFlight = Math.max(state.maxInFlight, state.inFlight)

    const proxy = new Proxy(
      {},
      {
        get(_, method) {
          if (method === 'then') {
            // Résolution décalée d'un tour : les appels lancés ensemble
            // (Promise.all) sont bien comptés comme simultanés.
            return (resolve, reject) =>
              new Promise((done) => setTimeout(done, 0)).then(() => {
                state.inFlight -= 1
                return resolve(result)
              }, reject)
          }
          return (...args) => {
            call.ops.push([method, args])
            return proxy
          }
        },
      },
    )
    return proxy
  }

  return {
    state,
    from: (table) => chain(table),
    rpc: async (name, args) => {
      state.rpcCalls.push({ name, args })
      return rpcQueue.length > 0 ? rpcQueue.shift() : { data: null, error: null }
    },
    auth: {
      getSession: async () => ({ data: { session: state.session } }),
    },
    storage: {
      from: (bucket) => ({
        remove: async (paths) => {
          removed.push({ bucket, paths })
          return { error: null }
        },
      }),
    },
    // Programmation et lecture
    queue(table, ...results) {
      queues.set(table, [...(queues.get(table) ?? []), ...results])
    },
    queueRpc(...results) {
      rpcQueue.push(...results)
    },
    removed,
    // Les opérations d'un appel, sous la forme { select: [args], eq: [args], ... }
    // (si une méthode est appelée plusieurs fois, la liste de ses appels).
    opsOf(call) {
      return call.ops.map(([method, args]) => [method, ...args])
    },
    callsTo(table) {
      return state.calls.filter((c) => c.table === table)
    },
    reset() {
      state.calls.length = 0
      state.rpcCalls.length = 0
      state.session = { user: { id: 'user-1' } }
      state.inFlight = 0
      state.maxInFlight = 0
      queues.clear()
      rpcQueue.length = 0
      removed.length = 0
    },
  }
}
