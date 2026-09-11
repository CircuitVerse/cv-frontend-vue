import { useRestrictedElementStore } from '../../store/restrictedElementStore'

export function showRestricted() {
  useRestrictedElementStore().isHoverVisible = true
}

export function hideRestricted() {
  useRestrictedElementStore().isHoverVisible = false
}

export function updateRestrictedElementsList() {
  // no-op: store.usedElements is the source of truth now
}

export function updateRestrictedElementsInScope(scope = globalScope) {
  if (restrictedElements.length === 0) return
  
  const used = []
  restrictedElements.forEach((element) => {
      if (scope[element].length > 0) {
          used.push(element)
      }
  })

  scope.restrictedCircuitElementsUsed = used
  useRestrictedElementStore().usedElements = used
}
