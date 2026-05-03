const tabs = Array.from(document.querySelectorAll('.tab'));
const valueInput = document.getElementById('value-input');
const sequenceInput = document.getElementById('sequence-input');
const addBtn = document.getElementById('add-btn');
const removeBtn = document.getElementById('remove-btn');
const loadSequenceBtn = document.getElementById('load-sequence-btn');
const searchBtn = document.getElementById('search-btn');
const traverseBtn = document.getElementById('traverse-btn');
const rebalanceBtn = document.getElementById('rebalance-btn');
const reverseBtn = document.getElementById('reverse-btn');
const clearBtn = document.getElementById('clear-btn');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
const shareStateBtn = document.getElementById('share-state-btn');
const copyDemoBriefBtn = document.getElementById('copy-demo-brief-btn');
const exportStateBtn = document.getElementById('export-state-btn');
const importStateBtn = document.getElementById('import-state-btn');
const importStateFile = document.getElementById('import-state-file');
const exportLogBtn = document.getElementById('export-log-btn');
const sampleBtn = document.getElementById('sample-btn');
const challengeBtn = document.getElementById('challenge-btn');
const statusEl = document.getElementById('status');
const traversalOutputEl = document.getElementById('traversal-output');
const metricSizeEl = document.getElementById('metric-size');
const metricSizeLabelEl = document.getElementById('metric-size-label');
const metricHeightEl = document.getElementById('metric-height');
const metricHeightLabelEl = document.getElementById('metric-height-label');
const metricMinEl = document.getElementById('metric-min');
const metricMinLabelEl = document.getElementById('metric-min-label');
const metricMaxEl = document.getElementById('metric-max');
const metricMaxLabelEl = document.getElementById('metric-max-label');
const metricLeavesEl = document.getElementById('metric-leaves');
const metricLeavesLabelEl = document.getElementById('metric-leaves-label');
const metricBalanceEl = document.getElementById('metric-balance');
const metricBalanceLabelEl = document.getElementById('metric-balance-label');
const complexityAddEl = document.getElementById('complexity-add');
const complexityRemoveEl = document.getElementById('complexity-remove');
const complexityLookupEl = document.getElementById('complexity-lookup');
const logEl = document.getElementById('log');
const structureTitle = document.getElementById('structure-title');
const structureNote = document.getElementById('structure-note');
const snapshotSummaryEl = document.getElementById('snapshot-summary');
const snapshotChipsEl = document.getElementById('snapshot-chips');
const operationPreviewTitleEl = document.getElementById('operation-preview-title');
const operationPreviewDetailEl = document.getElementById('operation-preview-detail');
const challengeObjectiveTitleEl = document.getElementById('challenge-objective-title');
const challengeObjectiveDetailEl = document.getElementById('challenge-objective-detail');
const challengeObjectiveStatusEl = document.getElementById('challenge-objective-status');
const demoReadinessSummaryEl = document.getElementById('demo-readiness-summary');
const demoReadinessScoreEl = document.getElementById('demo-readiness-score');
const demoReadinessListEl = document.getElementById('demo-readiness-list');
const playbookTitleEl = document.getElementById('playbook-title');
const playbookDetailEl = document.getElementById('playbook-detail');
const playbookWatchEl = document.getElementById('playbook-watch');
const switchboardTitleEl = document.getElementById('switchboard-title');
const switchboardDetailEl = document.getElementById('switchboard-detail');
const switchboardWatchEl = document.getElementById('switchboard-watch');
const invariantSummaryEl = document.getElementById('invariant-summary');
const invariantListEl = document.getElementById('invariant-list');
const stressTestTitleEl = document.getElementById('stress-test-title');
const stressTestDetailEl = document.getElementById('stress-test-detail');
const stressTestWatchEl = document.getElementById('stress-test-watch');
const handoffTitleEl = document.getElementById('handoff-title');
const handoffDetailEl = document.getElementById('handoff-detail');
const handoffWatchEl = document.getElementById('handoff-watch');
const visualArea = document.getElementById('visual-area');
const STORAGE_KEY = 'ds_playground_html_state_v1';

const structureInfo = {
  stack: {
    title: 'Stack Visualization',
    note: 'Last-in, first-out behavior.',
    addLabel: 'Push',
    removeLabel: 'Pop',
  },
  queue: {
    title: 'Queue Visualization',
    note: 'First-in, first-out behavior.',
    addLabel: 'Enqueue',
    removeLabel: 'Dequeue',
  },
  linked: {
    title: 'Linked List Visualization',
    note: 'Append nodes and remove from the head of the list.',
    addLabel: 'Append',
    removeLabel: 'Remove Head',
  },
  bst: {
    title: 'Binary Search Tree Visualization',
    note: 'Ordered tree operations with path-based search.',
    addLabel: 'Insert',
    removeLabel: 'Delete',
  },
};

const complexityInfo = {
  stack: { add: 'Push O(1)', remove: 'Pop O(1)', lookup: 'Peek O(1)' },
  queue: { add: 'Enqueue O(1)', remove: 'Dequeue O(1)', lookup: 'Front O(1)' },
  linked: { add: 'Append O(1) amortized', remove: 'Remove head O(1)', lookup: 'Tail read O(1)' },
  bst: { add: 'Insert O(log n) avg', remove: 'Delete O(log n) avg', lookup: 'Search O(log n) avg' },
};

const state = {
  active: 'stack',
  stack: [],
  queue: [],
  linked: [],
  bst: null,
  activeNodeId: null,
  foundNodeId: null,
  logs: [],
};

let nodeCounter = 0;
let searchInProgress = false;
const historyStack = [];
const redoStack = [];
let traversalModeIndex = 0;
const traversalModes = ['In-order', 'Pre-order', 'Post-order', 'Level-order'];

function syncNodeCounter() {
  const values = [];
  state.stack.forEach((item) => values.push(Number.parseInt(String(item.id || '').replace(/\D/g, ''), 10)));
  state.queue.forEach((item) => values.push(Number.parseInt(String(item.id || '').replace(/\D/g, ''), 10)));
  state.linked.forEach((item) => values.push(Number.parseInt(String(item.id || '').replace(/\D/g, ''), 10)));
  (function walk(node) {
    if (!node) return;
    values.push(Number.parseInt(String(node.id || '').replace(/\D/g, ''), 10));
    walk(node.left);
    walk(node.right);
  })(state.bst);

  nodeCounter = values.filter((value) => Number.isFinite(value)).reduce((max, value) => Math.max(max, value), 0);
}

function persistState() {
  syncUrlState();
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      active: state.active,
      stack: state.stack,
      queue: state.queue,
      linked: state.linked,
      bst: state.bst,
      logs: state.logs,
    })
  );
}

function currentWorkspaceSnapshot() {
  return {
    active: state.active,
    stack: state.stack,
    queue: state.queue,
    linked: state.linked,
    bst: state.bst,
  };
}

function encodeWorkspaceSnapshot(snapshot) {
  const json = JSON.stringify(snapshot);
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function decodeWorkspaceSnapshot(raw) {
  if (!raw) return null;

  try {
    const normalized = raw.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const json = decodeURIComponent(escape(atob(padded)));
    return JSON.parse(json);
  } catch (error) {
    return null;
  }
}

function syncUrlState() {
  const params = new URLSearchParams(window.location.search);
  params.set('workspace', encodeWorkspaceSnapshot(currentWorkspaceSnapshot()));
  const nextUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', nextUrl);
}

function hydrateFromUrlState() {
  const params = new URLSearchParams(window.location.search);
  const raw = params.get('workspace');
  if (!raw) return false;

  try {
    const parsed = decodeWorkspaceSnapshot(raw);
    if (!parsed) return false;
    state.active = parsed.active || 'stack';
    state.stack = Array.isArray(parsed.stack) ? normalizeLinearItems(parsed.stack) : [];
    state.queue = Array.isArray(parsed.queue) ? normalizeLinearItems(parsed.queue) : [];
    state.linked = Array.isArray(parsed.linked) ? normalizeLinearItems(parsed.linked) : [];
    state.bst = parsed.bst || null;
    syncNodeCounter();
    return true;
  } catch (error) {
    return false;
  }
}

function restoreState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!parsed) return false;

    state.active = parsed.active || 'stack';
    state.stack = Array.isArray(parsed.stack) ? normalizeLinearItems(parsed.stack) : [];
    state.queue = Array.isArray(parsed.queue) ? normalizeLinearItems(parsed.queue) : [];
    state.linked = Array.isArray(parsed.linked) ? normalizeLinearItems(parsed.linked) : [];
    state.bst = parsed.bst || null;
    state.logs = Array.isArray(parsed.logs) ? parsed.logs.slice(0, 16) : [];
    logEl.innerHTML = state.logs.map((entry) => `<li>${entry}</li>`).join('');
    syncNodeCounter();
    return true;
  } catch (error) {
    return false;
  }
}

function nextNodeId() {
  nodeCounter += 1;
  return `node-${nodeCounter}`;
}

function normalizeLinearItems(items = []) {
  return items.map((item) => {
    if (typeof item === 'object' && item !== null && Number.isInteger(item.value)) {
      return {
        id: typeof item.id === 'string' ? item.id : nextNodeId(),
        value: item.value,
      };
    }

    return {
      id: nextNodeId(),
      value: Number(item),
    };
  });
}

function setStatus(message) {
  statusEl.textContent = message;
}

function setTraversalOutput(message) {
  traversalOutputEl.textContent = message || '';
}

function addLog(message) {
  state.logs.unshift(`${new Date().toLocaleTimeString()} - ${message}`);
  state.logs = state.logs.slice(0, 16);

  logEl.innerHTML = state.logs.map((entry) => `<li>${entry}</li>`).join('');
  persistState();
}

function cloneTree(node) {
  if (!node) return null;
  return {
    id: node.id,
    value: node.value,
    left: cloneTree(node.left),
    right: cloneTree(node.right),
  };
}

function captureSnapshot() {
  historyStack.push({
    stack: [...state.stack],
    queue: [...state.queue],
    linked: [...state.linked],
    bst: cloneTree(state.bst),
    logs: [...state.logs],
  });

  if (historyStack.length > 80) {
    historyStack.shift();
  }

  redoStack.length = 0;
}

function applySnapshot(snapshot) {
  state.stack = [...snapshot.stack];
  state.queue = [...snapshot.queue];
  state.linked = [...(snapshot.linked || [])];
  state.bst = cloneTree(snapshot.bst);
  state.logs = [...snapshot.logs];
  logEl.innerHTML = state.logs.map((entry) => `<li>${entry}</li>`).join('');
}

function parseInputValue() {
  const parsed = Number.parseInt(valueInput.value, 10);
  if (!Number.isInteger(parsed)) {
    return null;
  }
  return parsed;
}

function parseSequenceValues() {
  const raw = sequenceInput.value.trim();
  if (!raw) return null;

  const values = raw
    .split(/[\s,]+/)
    .map((token) => Number.parseInt(token.trim(), 10))
    .filter((value) => Number.isInteger(value));

  return values.length ? values : null;
}

function bstHeight(node) {
  if (!node) return 0;
  return 1 + Math.max(bstHeight(node.left), bstHeight(node.right));
}

function bstLeafCount(node) {
  if (!node) return 0;
  if (!node.left && !node.right) return 1;
  return bstLeafCount(node.left) + bstLeafCount(node.right);
}

function bstMin(node) {
  let current = node;
  while (current?.left) current = current.left;
  return current?.value ?? '-';
}

function bstMax(node) {
  let current = node;
  while (current?.right) current = current.right;
  return current?.value ?? '-';
}

function bstShapeLabel(node) {
  if (!node) return '-';
  const spread = Math.abs(bstHeight(node.left) - bstHeight(node.right));
  if (spread <= 1) return 'Balanced';
  if (spread <= 3) return 'Leaning';
  return 'Skewed';
}

function duplicateRate(values) {
  if (!values.length) return '0%';
  const unique = new Set(values).size;
  return `${Math.round(((values.length - unique) / values.length) * 100)}%`;
}

function summarizeLinearShape(values) {
  if (!values.length) {
    return {
      summary: 'No nodes loaded yet. Add values or load a sequence to inspect the structure shape.',
      chips: [],
    };
  }

  const sortedAscending = values.every((value, index) => index === 0 || value >= values[index - 1]);
  const sortedDescending = values.every((value, index) => index === 0 || value <= values[index - 1]);
  const span = `${Math.min(...values)}-${Math.max(...values)}`;
  const direction = sortedAscending ? 'ascending' : sortedDescending ? 'descending' : 'mixed';

  return {
    summary: `${values.length} node${values.length === 1 ? '' : 's'} loaded with ${direction} ordering across a ${span} value span.`,
    chips: [`Head ${values[0]}`, `Tail ${values[values.length - 1]}`, `Duplicate rate ${duplicateRate(values)}`, `Span ${span}`],
  };
}

function summarizeBstShape() {
  if (!state.bst) {
    return {
      summary: 'No BST loaded yet. Insert nodes or load a sequence to inspect branch health.',
      chips: [],
    };
  }

  const values = [];
  (function collect(node) {
    if (!node) return;
    values.push(node.value);
    collect(node.left);
    collect(node.right);
  })(state.bst);

  const height = bstHeight(state.bst);
  const leaves = bstLeafCount(state.bst);
  const balance = bstShapeLabel(state.bst);

  return {
    summary: `BST holds ${values.length} unique node${values.length === 1 ? '' : 's'} over ${height} level${height === 1 ? '' : 's'} and currently reads as ${balance.toLowerCase()}.`,
    chips: [`Root ${state.bst.value}`, `Leaves ${leaves}`, `Range ${Math.min(...values)}-${Math.max(...values)}`, `Shape ${balance}`],
  };
}

function buildOperationPlaybook() {
  if (state.active === 'bst') {
    if (!state.bst) {
      return {
        title: 'Seed the tree',
        detail: 'Load the BST sample or insert a root plus two children so traversal and rebalance controls become meaningful.',
        watch: 'Empty trees hide the real shape tradeoff, so delay discussion until there is branch structure to inspect.',
      };
    }

    const height = bstHeight(state.bst);
    const shape = bstShapeLabel(state.bst);
    if (shape === 'Skewed') {
      return {
        title: 'Contrast search before and after rebalance',
        detail: `This tree is ${shape.toLowerCase()} across ${height} levels. Run search once, then rebalance to show how path length changes.`,
        watch: 'A skewed tree makes average-case lookup claims feel dishonest because the current path is closer to a linked list.',
      };
    }

    return {
      title: 'Pair traversal with lookup cost',
      detail: `The current BST is ${shape.toLowerCase()}, so this is a good moment to compare search-path animation against traversal output.`,
      watch: 'Duplicates are ignored in BST mode, so call out that shape changes only when unique values are inserted.',
    };
  }

  const values =
    state.active === 'stack'
      ? state.stack.map((item) => item.value)
      : state.active === 'queue'
        ? state.queue.map((item) => item.value)
        : state.linked.map((item) => item.value);

  if (!values.length) {
    return {
      title: 'Load a working sequence',
      detail: 'Use the sample or a custom sequence so the structure has enough shape to talk about head/tail or top depth.',
      watch: 'Tiny structures flatten the differences between stack, queue, and linked-list behavior.',
    };
  }

  const duplicateShare = ((values.length - new Set(values).size) / Math.max(1, values.length)) * 100;
  const mixedOrder =
    !values.every((value, index) => index === 0 || value >= values[index - 1]) &&
    !values.every((value, index) => index === 0 || value <= values[index - 1]);

  if (state.active === 'stack') {
    return {
      title: 'Teach push and pop pressure',
      detail: `With ${values.length} item${values.length === 1 ? '' : 's'} loaded, you can now show how the visible top changes under repeated push and pop operations.`,
      watch: duplicateShare >= 30 ? 'Duplicate-heavy stack values make visual state changes harder to read, so narrate the top marker explicitly.' : 'Call out that only the top element is directly accessible even when the stack looks visually deep.',
    };
  }

  if (state.active === 'queue') {
    return {
      title: 'Walk the service line',
      detail: `This queue has ${values.length} visible item${values.length === 1 ? '' : 's'}, which is enough to contrast arrival order with dequeue order.`,
      watch: mixedOrder ? 'Mixed values are fine here because queue behavior is about order of arrival, not sorted content.' : 'If the values look ordered, remind the viewer that FIFO is preserving arrival order rather than sorting.',
    };
  }

  return {
    title: 'Use repeated values to explain pointers',
    detail: `The linked list currently shows ${values.length} node${values.length === 1 ? '' : 's'}, which makes head movement and repeated values easy to explain.`,
    watch: duplicateShare >= 20 ? 'Repeated values are useful here because they show why positional traversal matters more than value uniqueness.' : 'Linked-list cost only becomes obvious when you explain that middle access still requires walking from the head.',
  };
}

function renderStructureSnapshot() {
  if (!snapshotSummaryEl || !snapshotChipsEl) return;

  const values =
    state.active === 'stack'
      ? state.stack.map((item) => item.value)
      : state.active === 'queue'
        ? state.queue.map((item) => item.value)
        : state.active === 'linked'
          ? state.linked.map((item) => item.value)
          : [];

  const payload = state.active === 'bst' ? summarizeBstShape() : summarizeLinearShape(values);
  snapshotSummaryEl.textContent = payload.summary;
  snapshotChipsEl.innerHTML = payload.chips.length
    ? payload.chips.map((chip) => `<span class="snapshot-chip">${chip}</span>`).join('')
    : '<span class="snapshot-chip">Waiting for data</span>';
}

function renderOperationPreview() {
  if (!operationPreviewTitleEl || !operationPreviewDetailEl) return;

  const parsed = parseInteger(valueInput.value);
  const values =
    state.active === 'stack'
      ? state.stack.map((item) => item.value)
      : state.active === 'queue'
        ? state.queue.map((item) => item.value)
        : state.active === 'linked'
          ? state.linked.map((item) => item.value)
          : [];

  if (state.active === 'bst') {
    operationPreviewTitleEl.textContent = 'BST Preview';

    if (!state.bst) {
      operationPreviewDetailEl.textContent = parsed === null
        ? 'Enter an integer to preview the first insert or search path.'
        : `Inserting ${parsed} would create the root and make the first branch decision trivial.`;
      return;
    }

    if (parsed === null) {
      operationPreviewDetailEl.textContent = 'Enter an integer to preview the next insert or search path through the current tree.';
      return;
    }

    const visited = [];
    let current = state.bst;
    let verdict = `Insert ${parsed} as a new leaf.`;

    while (current) {
      visited.push(current.value);
      if (parsed === current.value) {
        verdict = `${parsed} already exists, so search would hit immediately and insert would be ignored.`;
        break;
      }

      if (parsed < current.value) {
        if (!current.left) {
          verdict = `Insert ${parsed} as the left child of ${current.value}.`;
          break;
        }
        current = current.left;
      } else {
        if (!current.right) {
          verdict = `Insert ${parsed} as the right child of ${current.value}.`;
          break;
        }
        current = current.right;
      }
    }

    operationPreviewDetailEl.textContent = `Search path would read ${visited.join(' -> ')}. ${verdict}`;
    return;
  }

  operationPreviewTitleEl.textContent = 'Next Move Preview';

  if (!values.length) {
    operationPreviewDetailEl.textContent = parsed === null
      ? 'Enter an integer or load a sample to preview the next structural move.'
      : state.active === 'stack'
        ? `Push ${parsed} to create the first stack frame.`
        : state.active === 'queue'
          ? `Enqueue ${parsed} to start a visible service line.`
          : `Append ${parsed} to create the head and tail of the list.`;
    return;
  }

  if (parsed === null) {
    const removal = state.active === 'stack'
      ? `Pop would remove ${values[values.length - 1]} next.`
      : state.active === 'queue'
        ? `Dequeue would remove ${values[0]} next.`
        : `Remove Head would drop ${values[0]} next.`;
    operationPreviewDetailEl.textContent = `${removal} Enter an integer to preview the next add operation too.`;
    return;
  }

  if (state.active === 'stack') {
    operationPreviewDetailEl.textContent = `Push ${parsed} above ${values[values.length - 1]}. A follow-up pop would immediately reveal ${values[values.length - 1]} again.`;
    return;
  }

  if (state.active === 'queue') {
    operationPreviewDetailEl.textContent = `Enqueue ${parsed} behind ${values[values.length - 1]}, while the next dequeue still removes ${values[0]} first.`;
    return;
  }

  operationPreviewDetailEl.textContent = `Append ${parsed} after tail ${values[values.length - 1]}; removing head would still detach ${values[0]} first.`;
}

function renderOperationPlaybook() {
  if (!playbookTitleEl || !playbookDetailEl || !playbookWatchEl) return;

  const playbook = buildOperationPlaybook();
  playbookTitleEl.textContent = playbook.title;
  playbookDetailEl.textContent = playbook.detail;
  playbookWatchEl.textContent = playbook.watch;
}

function renderStructureSwitchboard() {
  if (!switchboardTitleEl || !switchboardDetailEl || !switchboardWatchEl) return;

  const linearValues =
    state.active === 'stack'
      ? state.stack.map((item) => item.value)
      : state.active === 'queue'
        ? state.queue.map((item) => item.value)
        : state.active === 'linked'
          ? state.linked.map((item) => item.value)
          : collectBSTValues(state.bst);

  if (!linearValues.length) {
    switchboardTitleEl.textContent = 'Seed a richer workload first';
    switchboardDetailEl.textContent = 'Structure switching only becomes interesting once the current values create visible order, depth, or duplicates.';
    switchboardWatchEl.textContent = 'Load Sample or Load Challenge before asking whether another structure would teach the same data better.';
    return;
  }

  if (state.active === 'stack') {
    switchboardTitleEl.textContent = linearValues.length >= 5 ? 'Stay with stack unless service order matters' : 'Deepen the stack first';
    switchboardDetailEl.textContent = linearValues.length >= 5
      ? 'This workload already explains resurfacing frames well. Switch to Queue only if you want the same values to read as arrival-order fairness instead.'
      : 'Add a few more values before deciding whether stack or queue makes the stronger ordering story.';
    switchboardWatchEl.textContent = 'If the audience keeps asking who waited longest, you chose the wrong structure for the story.';
    return;
  }

  if (state.active === 'queue') {
    switchboardTitleEl.textContent = 'Queue is best when fairness beats urgency';
    switchboardDetailEl.textContent = 'Switch to Stack if you want to emphasize newest-first undo behavior, or to BST if lookup speed matters more than service order.';
    switchboardWatchEl.textContent = 'Once the demo starts talking about search or branching, the queue has stopped being the right visual model.';
    return;
  }

  if (state.active === 'linked') {
    const duplicateCount = linearValues.length - new Set(linearValues).size;
    switchboardTitleEl.textContent = duplicateCount > 0 ? 'Linked list earns its keep here' : 'Consider queue or stack for simpler order stories';
    switchboardDetailEl.textContent = duplicateCount > 0
      ? 'Repeated values make pointer position matter, so linked list is the clearest choice for this dataset.'
      : 'Without duplicate pressure or pointer narration, the same values may read more clearly as a stack or queue.';
    switchboardWatchEl.textContent = 'If node identity does not matter, do not force the audience to care about links.';
    return;
  }

  const height = bstHeight(state.bst);
  switchboardTitleEl.textContent = height >= 3 ? 'BST is the right pick when search path matters' : 'Grow the tree or use a linear structure instead';
  switchboardDetailEl.textContent = height >= 3
    ? 'The current tree has enough branching to justify BST-specific search, delete, and rebalance stories.'
    : 'This tree is too shallow to pay off branching logic. Use stack or queue if order is the real lesson, or add more nodes first.';
  switchboardWatchEl.textContent = 'If the tree never branches in a meaningful way, the visual complexity is not earning its place.';
}

function renderChallengeObjective() {
  if (!challengeObjectiveTitleEl || !challengeObjectiveDetailEl || !challengeObjectiveStatusEl) return;

  if (state.active === 'bst') {
    const count = countBSTNodes(state.bst);
    const balanced = state.bst ? bstShapeLabel(state.bst) === 'Balanced' : false;
    challengeObjectiveTitleEl.textContent = balanced ? 'Balanced search tree ready' : 'Build a before/after BST story';
    challengeObjectiveDetailEl.textContent = !state.bst
      ? 'Load Sample or Load Challenge, then search once so the tree has enough structure to compare path length and shape.'
      : balanced
        ? `The BST already has ${count} nodes in a balanced posture. Search, then explain how rebalancing preserved sorted order while shrinking path depth.`
        : `This BST has ${count} nodes and still leans ${bstShapeLabel(state.bst).toLowerCase()}. Search once, then rebalance to create a clear before/after lookup comparison.`;
    challengeObjectiveStatusEl.textContent = count >= 6
      ? 'Status: ready for a portfolio walkthrough.'
      : 'Status: add a few more BST nodes before the demo.';
    return;
  }

  const values =
    state.active === 'stack'
      ? state.stack.map((item) => item.value)
      : state.active === 'queue'
        ? state.queue.map((item) => item.value)
        : state.linked.map((item) => item.value);

  if (!values.length) {
    challengeObjectiveTitleEl.textContent = 'Seed a non-trivial structure';
    challengeObjectiveDetailEl.textContent = 'Load Sample or Load Challenge before demoing so add/remove order has real stakes instead of a one-node toy example.';
    challengeObjectiveStatusEl.textContent = 'Status: one setup move needed.';
    return;
  }

  if (state.active === 'stack') {
    challengeObjectiveTitleEl.textContent = values.length >= 5 ? 'LIFO challenge ready' : 'Deepen the stack';
    challengeObjectiveDetailEl.textContent = values.length >= 5
      ? `The stack is deep enough to show frame churn. Push one marker above ${values[values.length - 1]}, then pop twice so the resurfacing frame is obvious.`
      : `Add ${5 - values.length} more stack item${5 - values.length === 1 ? '' : 's'} so the pop order becomes visually persuasive.`;
    challengeObjectiveStatusEl.textContent = values.length >= 5
      ? 'Status: ready for a portfolio walkthrough.'
      : 'Status: one more setup move recommended before the demo.';
    return;
  }

  if (state.active === 'queue') {
    challengeObjectiveTitleEl.textContent = values.length >= 5 ? 'FIFO pressure line ready' : 'Grow the service line';
    challengeObjectiveDetailEl.textContent = values.length >= 5
      ? `The queue already reads like a real service line. Enqueue one item behind ${values[values.length - 1]}, then dequeue twice to prove arrival order still wins.`
      : `Add ${5 - values.length} more queue item${5 - values.length === 1 ? '' : 's'} so front-vs-back behavior is easier to narrate.`;
    challengeObjectiveStatusEl.textContent = values.length >= 5
      ? 'Status: ready for a portfolio walkthrough.'
      : 'Status: one more setup move recommended before the demo.';
    return;
  }

  const duplicateCount = values.length - new Set(values).size;
  challengeObjectiveTitleEl.textContent = duplicateCount > 0 ? 'Linked-list pointer story ready' : 'Create repeated nodes';
  challengeObjectiveDetailEl.textContent = duplicateCount > 0
    ? `The list already includes ${duplicateCount} repeated value${duplicateCount === 1 ? '' : 's'}, which makes head movement and positional traversal easier to explain.`
    : 'Add one repeated value to the linked list so you can explain why pointer position still matters even when values are not unique.';
  challengeObjectiveStatusEl.textContent = values.length >= 5 && duplicateCount > 0
    ? 'Status: ready for a portfolio walkthrough.'
    : 'Status: add depth or a repeated node before the demo.';
}

function buildStressTest() {
  if (state.active === 'bst') {
    if (!state.bst) {
      return {
        title: 'Seed the BST first',
        detail: 'Load a sample tree before you search, delete, or rebalance so the viewer can actually see branch pressure.',
        watch: 'Without at least one branch on each side, search depth and replacement behavior stay invisible.',
      };
    }

    const values = collectBSTValues(state.bst);
    const rootValue = state.bst.value;
    const skewed = bstHeight(state.bst) >= Math.max(4, Math.ceil(Math.log2(Math.max(2, values.length))) + 1);
    return {
      title: skewed ? 'Search, then rebalance the same tree' : 'Delete the root after one guided search',
      detail: skewed
        ? `Search for ${values[values.length - 1]}, then rebalance to show how lookup paths shrink when the tree stops leaning.`
        : `Search once, then delete the root (${rootValue}) so the replacement node logic becomes obvious in the visual area and log.`,
      watch: skewed
        ? 'Call out the before/after path length, not just the final balanced drawing.'
        : 'Explain which successor rises into the root so delete reads like structure maintenance, not magic.',
    };
  }

  const values =
    state.active === 'stack'
      ? state.stack.map((item) => item.value)
      : state.active === 'queue'
        ? state.queue.map((item) => item.value)
        : state.linked.map((item) => item.value);

  if (!values.length) {
    return {
      title: 'Load more pressure',
      detail: 'Use Sample or a manual sequence before stress-testing so the next operation has something meaningful to disturb.',
      watch: 'One-node demos hide the difference between stack, queue, and linked-list behavior.',
    };
  }

  if (state.active === 'stack') {
    return {
      title: 'Push one marker, then pop twice',
      detail: `Push a new marker above ${values[values.length - 1]}, then pop twice to show that the newest frame leaves first and the older frame resurfaces.`,
      watch: 'Keep naming the top item out loud so the LIFO rule stays concrete.',
    };
  }

  if (state.active === 'queue') {
    return {
      title: 'Add urgency without skipping the line',
      detail: `Enqueue one more item behind ${values[values.length - 1]}, then dequeue twice to prove the oldest front item still leaves first.`,
      watch: 'Use the front/back labels when you explain why urgent work still waits in a strict FIFO queue.',
    };
  }

  return {
    title: 'Append tail pressure, then remove the head',
    detail: `Append one marker after ${values[values.length - 1]}, then remove the head (${values[0]}) so the viewer sees the chain update from both ends.`,
    watch: 'Point at the new head and unchanged tail to keep pointer movement readable.',
  };
}

function renderStressTest() {
  if (!stressTestTitleEl || !stressTestDetailEl || !stressTestWatchEl) return;
  const stressTest = buildStressTest();
  stressTestTitleEl.textContent = stressTest.title;
  stressTestDetailEl.textContent = stressTest.detail;
  stressTestWatchEl.textContent = stressTest.watch;
}

function renderStudyHandoff() {
  if (!handoffTitleEl || !handoffDetailEl || !handoffWatchEl) return;

  if (state.active === 'bst') {
    const count = countBSTNodes(state.bst);
    if (!count) {
      handoffTitleEl.textContent = 'Seed the BST before handing it off';
      handoffDetailEl.textContent = 'Load a sample tree first so the recap can describe search depth, shape, and one concrete contrast move.';
      handoffWatchEl.textContent = 'A study handoff is only useful once the tree has a visible path or rebalance story.';
      return;
    }

    handoffTitleEl.textContent = `BST handoff: ${count} nodes, ${bstShapeLabel(state.bst).toLowerCase()} shape`;
    handoffDetailEl.textContent = `Recap the current search posture, then ${bstHeight(state.bst) >= 4 ? 'search the deepest visible value and rebalance' : `delete root ${state.bst.value} after one search`} to make the structural payoff visible fast.`;
    handoffWatchEl.textContent = 'Name the before/after path length explicitly so the viewer hears why this tree shape matters.';
    return;
  }

  const values =
    state.active === 'stack'
      ? state.stack.map((item) => item.value)
      : state.active === 'queue'
        ? state.queue.map((item) => item.value)
        : state.linked.map((item) => item.value);

  if (!values.length) {
    handoffTitleEl.textContent = 'Build one non-trivial example first';
    handoffDetailEl.textContent = 'Load Sample or Challenge before handing the structure off so the recap has real order, not a toy one-node state.';
    handoffWatchEl.textContent = 'The handoff becomes useful only once the next removal teaches something visible.';
    return;
  }

  const summary =
    state.active === 'stack'
      ? `top ${values[values.length - 1]} over base ${values[0]}`
      : state.active === 'queue'
        ? `front ${values[0]} with tail ${values[values.length - 1]}`
        : `head ${values[0]} with tail ${values[values.length - 1]}`;
  const nextMove =
    state.active === 'stack'
      ? 'push one marker, then pop twice'
      : state.active === 'queue'
        ? 'enqueue once, then dequeue twice'
        : 'append once, then remove the head';

  handoffTitleEl.textContent = `${structureInfo[state.active].title} handoff: ${values.length} nodes, ${summary}`;
  handoffDetailEl.textContent = `Recap the current order, then ${nextMove} so the audience sees the rule before you switch structures or export the demo brief.`;
  handoffWatchEl.textContent = 'Keep the explanation anchored on which item leaves next; that is the whole behavioral point of the structure.';
}

function renderDemoReadiness() {
  if (!demoReadinessSummaryEl || !demoReadinessScoreEl || !demoReadinessListEl) return;

  let rows = [];
  if (state.active === 'bst') {
    const nodeCount = countBSTNodes(state.bst);
    const height = bstHeight(state.bst);
    const shape = bstShapeLabel(state.bst);
    rows = [
      {
        label: 'Tree depth',
        passed: nodeCount >= 6 && height >= 3,
        detail:
          nodeCount >= 6 && height >= 3
            ? `Tree depth is ${height} across ${nodeCount} nodes, so lookup paths are visible.`
            : 'Grow the tree to at least 6 nodes with height 3 so search and rebalance have visible stakes.',
      },
      {
        label: 'Contrast move',
        passed: Boolean(state.bst) && nodeCount >= 5,
        detail: state.bst
          ? `A ${shape.toLowerCase()} tree gives you a clear search-then-rebalance contrast.`
          : 'Load or build a tree first so there is a search path to narrate.',
      },
      {
        label: 'Walkthrough posture',
        passed: nodeCount >= 6,
        detail:
          nodeCount >= 6
            ? 'The current BST already clears the baseline for a portfolio walkthrough.'
            : 'Add a few more nodes before trying to sell the BST as a full demo.',
      },
    ];
  } else {
    const values =
      state.active === 'stack'
        ? state.stack.map((item) => item.value)
        : state.active === 'queue'
          ? state.queue.map((item) => item.value)
          : state.linked.map((item) => item.value);
    const spread = values.length ? Math.max(...values) - Math.min(...values) : 0;
    const duplicates = new Set(values).size !== values.length;
    rows = [
      {
        label: 'Visible depth',
        passed: values.length >= 5,
        detail:
          values.length >= 5
            ? `${values.length} values are on screen, so order behavior is readable.`
            : `Add ${5 - values.length} more value${5 - values.length === 1 ? '' : 's'} so the structure is more than a toy example.`,
      },
      {
        label: 'Edge contrast',
        passed: values.length >= 3,
        detail:
          values.length >= 3
            ? 'There is enough material to narrate top/front/head behavior before and after a removal.'
            : 'Load at least three values so add/remove operations visibly change the exposed edge.',
      },
      {
        label: 'Pressure signal',
        passed: spread >= 4 || duplicates,
        detail:
          spread >= 4 || duplicates
            ? 'The current values already create variation or duplication worth calling out in the demo.'
            : 'Add a wider-spread or duplicate value so the walkthrough can talk about pressure instead of only order.',
      },
    ];
  }

  const passed = rows.filter((row) => row.passed).length;
  const score = Math.round((passed / rows.length) * 100);
  demoReadinessSummaryEl.textContent =
    passed === rows.length
      ? state.active === 'bst'
        ? 'BST story is demo-ready.'
        : 'Linear structure is demo-ready.'
      : `${rows.length - passed} more setup cue${rows.length - passed === 1 ? '' : 's'} would strengthen this walkthrough.`;
  demoReadinessScoreEl.textContent = `Readiness score: ${score}%`;
  demoReadinessListEl.innerHTML = rows
    .map((row) => `<li><strong>${row.passed ? 'Ready' : 'Missing'} | ${row.label}:</strong> ${row.detail}</li>`)
    .join('');
}

function renderInvariantCheck() {
  if (!invariantSummaryEl || !invariantListEl) return;

  const values =
    state.active === 'stack'
      ? state.stack.map((item) => item.value)
      : state.active === 'queue'
        ? state.queue.map((item) => item.value)
        : state.active === 'linked'
          ? state.linked.map((item) => item.value)
          : collectBSTValues(state.bst);

  if (!values.length) {
    invariantSummaryEl.textContent = 'Empty structures pass, but they do not demonstrate much behavior yet.';
    invariantListEl.innerHTML = '<li>Add or load values to inspect richer invariants.</li>';
    return;
  }

  let rows = [];
  if (state.active === 'stack') {
    rows = [
      `Top points to ${values[values.length - 1]}, so pop should remove the newest visible value.`,
      `Stored node count matches the metric count: ${state.stack.length}.`,
    ];
  } else if (state.active === 'queue') {
    rows = [
      `Front points to ${values[0]}, so dequeue should remove the oldest visible value.`,
      `Back points to ${values[values.length - 1]}, so enqueue should append after it.`,
    ];
  } else if (state.active === 'linked') {
    rows = [
      `Head points to ${values[0]} and tail points to ${values[values.length - 1]}.`,
      'Each visible node has one next edge except the tail.',
    ];
  } else {
    const ordered = values.every((value, index) => index === 0 || value > values[index - 1]);
    rows = [
      `In-order traversal is ${ordered ? 'strictly ascending' : 'not ascending; check duplicate/import handling'}.`,
      `Tree height is ${bstHeight(state.bst)} with ${bstLeafCount(state.bst)} leaf node${bstLeafCount(state.bst) === 1 ? '' : 's'}.`,
    ];
  }

  invariantSummaryEl.textContent = `${structureInfo[state.active].label} invariant check passed for ${values.length} value${values.length === 1 ? '' : 's'}.`;
  invariantListEl.innerHTML = rows.map((row) => `<li>${row}</li>`).join('');
}

function updateMetrics() {
  if (state.active === 'stack') {
    const values = state.stack.map((item) => item.value);
    metricSizeLabelEl.textContent = 'Size';
    metricHeightLabelEl.textContent = 'Top';
    metricMinLabelEl.textContent = 'Bottom';
    metricMaxLabelEl.textContent = 'Min';
    metricLeavesLabelEl.textContent = 'Max';
    metricBalanceLabelEl.textContent = 'Duplicates';
    metricSizeEl.textContent = String(state.stack.length);
    metricHeightEl.textContent = values.length ? String(values[values.length - 1]) : '-';
    metricMinEl.textContent = values.length ? String(values[0]) : '-';
    metricMaxEl.textContent = values.length ? String(Math.min(...values)) : '-';
    metricLeavesEl.textContent = values.length ? String(Math.max(...values)) : '-';
    metricBalanceEl.textContent = duplicateRate(values);
    return;
  }

  if (state.active === 'queue') {
    const values = state.queue.map((item) => item.value);
    metricSizeLabelEl.textContent = 'Size';
    metricHeightLabelEl.textContent = 'Front';
    metricMinLabelEl.textContent = 'Back';
    metricMaxLabelEl.textContent = 'Min';
    metricLeavesLabelEl.textContent = 'Max';
    metricBalanceLabelEl.textContent = 'Duplicates';
    metricSizeEl.textContent = String(state.queue.length);
    metricHeightEl.textContent = values.length ? String(values[0]) : '-';
    metricMinEl.textContent = values.length ? String(values[values.length - 1]) : '-';
    metricMaxEl.textContent = values.length ? String(Math.min(...values)) : '-';
    metricLeavesEl.textContent = values.length ? String(Math.max(...values)) : '-';
    metricBalanceEl.textContent = duplicateRate(values);
    return;
  }

  if (state.active === 'linked') {
    const values = state.linked.map((item) => item.value);
    metricSizeLabelEl.textContent = 'Size';
    metricHeightLabelEl.textContent = 'Head';
    metricMinLabelEl.textContent = 'Tail';
    metricMaxLabelEl.textContent = 'Min';
    metricLeavesLabelEl.textContent = 'Max';
    metricBalanceLabelEl.textContent = 'Duplicates';
    metricSizeEl.textContent = String(state.linked.length);
    metricHeightEl.textContent = values.length ? String(values[0]) : '-';
    metricMinEl.textContent = values.length ? String(values[values.length - 1]) : '-';
    metricMaxEl.textContent = values.length ? String(Math.min(...values)) : '-';
    metricLeavesEl.textContent = values.length ? String(Math.max(...values)) : '-';
    metricBalanceEl.textContent = duplicateRate(values);
    return;
  }

  metricSizeLabelEl.textContent = 'Size';
  metricHeightLabelEl.textContent = 'BST Height';
  metricMinLabelEl.textContent = 'BST Min';
  metricMaxLabelEl.textContent = 'BST Max';
  metricLeavesLabelEl.textContent = 'Leaf Count';
  metricBalanceLabelEl.textContent = 'Shape';

  let count = 0;
  (function walk(node) {
    if (!node) return;
    count += 1;
    walk(node.left);
    walk(node.right);
  })(state.bst);

  metricSizeEl.textContent = String(count);
  metricHeightEl.textContent = String(bstHeight(state.bst));
  metricMinEl.textContent = String(bstMin(state.bst));
  metricMaxEl.textContent = String(bstMax(state.bst));
  metricLeavesEl.textContent = String(bstLeafCount(state.bst));
  metricBalanceEl.textContent = bstShapeLabel(state.bst);
}

function insertBST(node, value) {
  if (!node) {
    return { node: { id: nextNodeId(), value, left: null, right: null }, inserted: true };
  }

  if (value < node.value) {
    const result = insertBST(node.left, value);
    node.left = result.node;
    return { node: { ...node }, inserted: result.inserted };
  }

  if (value > node.value) {
    const result = insertBST(node.right, value);
    node.right = result.node;
    return { node: { ...node }, inserted: result.inserted };
  }

  return { node, inserted: false };
}

function findMinNode(node) {
  let current = node;
  while (current && current.left) {
    current = current.left;
  }
  return current;
}

function deleteBST(node, value) {
  if (!node) return { node: null, deleted: false };

  if (value < node.value) {
    const result = deleteBST(node.left, value);
    node.left = result.node;
    return { node: { ...node }, deleted: result.deleted };
  }

  if (value > node.value) {
    const result = deleteBST(node.right, value);
    node.right = result.node;
    return { node: { ...node }, deleted: result.deleted };
  }

  if (!node.left) return { node: node.right, deleted: true };
  if (!node.right) return { node: node.left, deleted: true };

  const successor = findMinNode(node.right);
  node.value = successor.value;
  const result = deleteBST(node.right, successor.value);
  node.right = result.node;
  return { node: { ...node }, deleted: true };
}

function collectBSTValues(node, output = []) {
  if (!node) return output;
  collectBSTValues(node.left, output);
  output.push(node.value);
  collectBSTValues(node.right, output);
  return output;
}

function buildBalancedBST(values, start = 0, end = values.length - 1) {
  if (start > end) return null;

  const mid = Math.floor((start + end) / 2);
  return {
    id: nextNodeId(),
    value: values[mid],
    left: buildBalancedBST(values, start, mid - 1),
    right: buildBalancedBST(values, mid + 1, end),
  };
}

function buildSearchPath(root, target) {
  const path = [];
  let current = root;

  while (current) {
    path.push(current.id);
    if (target === current.value) {
      return { path, foundId: current.id };
    }
    current = target < current.value ? current.left : current.right;
  }

  return { path, foundId: null };
}

function renderStack() {
  if (!state.stack.length) {
    visualArea.innerHTML = '<p class="empty">Stack is empty. Push a value to begin.</p>';
    return;
  }

  const nodes = state.stack
    .map((item, index) => {
      const isTop = index === state.stack.length - 1;
      const activeClass = state.activeNodeId === item.id ? 'active' : '';
      const foundClass = state.foundNodeId === item.id ? 'found' : '';
      return `<div class="node ${isTop ? 'badge top' : ''} ${activeClass} ${foundClass}">${item.value}</div>`;
    })
    .reverse()
    .join('');

  visualArea.innerHTML = `<div class="node-list stack-list">${nodes}</div>`;
}

function renderQueue() {
  if (!state.queue.length) {
    visualArea.innerHTML = '<p class="empty">Queue is empty. Enqueue a value to begin.</p>';
    return;
  }

  const nodes = state.queue
    .map((item, index) => {
      const activeClass = state.activeNodeId === item.id ? 'active' : '';
      const foundClass = state.foundNodeId === item.id ? 'found' : '';
      return `<div class="node ${index === 0 ? 'badge front' : ''} ${activeClass} ${foundClass}">${item.value}</div>`;
    })
    .join('');

  visualArea.innerHTML = `<div class="node-list">${nodes}</div>`;
}

function renderLinkedList() {
  if (!state.linked.length) {
    visualArea.innerHTML = '<p class="empty">Linked list is empty. Append a value to begin.</p>';
    return;
  }

  const nodes = state.linked
    .map((item, index) => {
      const activeClass = state.activeNodeId === item.id ? 'active' : '';
      const foundClass = state.foundNodeId === item.id ? 'found' : '';
      return `<div class="node ${index === 0 ? 'badge list-head' : ''} ${activeClass} ${foundClass}">${item.value}</div>`;
    })
    .join('');

  visualArea.innerHTML = `<div class="node-list">${nodes}</div>`;
}

function collectTreeLayout(node, depth, minX, maxX, lines, nodes) {
  if (!node) return;

  const x = (minX + maxX) / 2;
  const y = 44 + depth * 82;

  nodes.push({ id: node.id, value: node.value, x, y });

  if (node.left) {
    const leftX = (minX + x) / 2;
    const leftY = 44 + (depth + 1) * 82;
    lines.push({ x1: x, y1: y, x2: leftX, y2: leftY });
    collectTreeLayout(node.left, depth + 1, minX, x, lines, nodes);
  }

  if (node.right) {
    const rightX = (x + maxX) / 2;
    const rightY = 44 + (depth + 1) * 82;
    lines.push({ x1: x, y1: y, x2: rightX, y2: rightY });
    collectTreeLayout(node.right, depth + 1, x, maxX, lines, nodes);
  }
}

function renderBST() {
  if (!state.bst) {
    visualArea.innerHTML = '<p class="empty">BST is empty. Insert values to begin.</p>';
    return;
  }

  const width = Math.max(760, visualArea.clientWidth - 16);
  const height = 390;
  const lines = [];
  const nodes = [];

  collectTreeLayout(state.bst, 0, 16, width - 16, lines, nodes);

  const linesSvg = lines
    .map((line) => `<line class="tree-line" x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" />`)
    .join('');

  const nodesSvg = nodes
    .map((node) => {
      const activeClass = node.id === state.activeNodeId ? 'active' : '';
      const foundClass = node.id === state.foundNodeId ? 'found' : '';
      return `
        <g class="tree-node ${activeClass} ${foundClass}">
          <circle cx="${node.x}" cy="${node.y}" r="21"></circle>
          <text x="${node.x}" y="${node.y}">${node.value}</text>
        </g>
      `;
    })
    .join('');

  visualArea.innerHTML = `
    <svg class="tree-svg" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMin meet">
      ${linesSvg}
      ${nodesSvg}
    </svg>
  `;
}

function renderVisualization() {
  if (state.active === 'stack') {
    renderStack();
    updateMetrics();
    renderStructureSnapshot();
    renderOperationPreview();
    renderChallengeObjective();
    renderDemoReadiness();
    renderOperationPlaybook();
    renderStructureSwitchboard();
    renderStressTest();
    renderInvariantCheck();
    return;
  }

  if (state.active === 'queue') {
    renderQueue();
    updateMetrics();
    renderStructureSnapshot();
    renderOperationPreview();
    renderChallengeObjective();
    renderDemoReadiness();
    renderOperationPlaybook();
    renderStructureSwitchboard();
    renderStressTest();
    renderInvariantCheck();
    return;
  }

  if (state.active === 'linked') {
    renderLinkedList();
    updateMetrics();
    renderStructureSnapshot();
    renderOperationPreview();
    renderChallengeObjective();
    renderDemoReadiness();
    renderOperationPlaybook();
    renderStructureSwitchboard();
    renderStressTest();
    renderInvariantCheck();
    persistState();
    return;
  }

  renderBST();
  updateMetrics();
  renderStructureSnapshot();
  renderOperationPreview();
  renderChallengeObjective();
  renderDemoReadiness();
  renderOperationPlaybook();
  renderStructureSwitchboard();
  renderStressTest();
  renderStudyHandoff();
  renderInvariantCheck();
  persistState();
}

function updateControlLabels() {
  const info = structureInfo[state.active];
  const complexity = complexityInfo[state.active];
  structureTitle.textContent = info.title;
  structureNote.textContent = info.note;
  addBtn.textContent = info.addLabel;
  removeBtn.textContent = info.removeLabel;
  complexityAddEl.textContent = complexity.add;
  complexityRemoveEl.textContent = complexity.remove;
  complexityLookupEl.textContent = complexity.lookup;

  const isBST = state.active === 'bst';
  searchBtn.classList.toggle('hidden', false);
  traverseBtn.classList.toggle('hidden', !isBST);
  rebalanceBtn.classList.toggle('hidden', !isBST);
  reverseBtn.classList.toggle('hidden', isBST);
  reverseBtn.textContent =
    state.active === 'queue' ? 'Reverse Queue' : state.active === 'linked' ? 'Reverse Linked List' : 'Reverse Stack';
  if (!isBST) {
    setTraversalOutput('');
  }
}

function handleReverse() {
  if (state.active === 'bst') {
    setStatus('Reverse order is only available for stack, queue, and linked-list views.');
    return;
  }

  const values = state.active === 'stack' ? state.stack : state.active === 'queue' ? state.queue : state.linked;
  if (values.length < 2) {
    setStatus(`Need at least two items to reverse the ${structureInfo[state.active].title.toLowerCase()}.`);
    return;
  }

  captureSnapshot();
  if (state.active === 'stack') {
    state.stack = [...state.stack].reverse();
    addLog('Stack reversed');
  } else if (state.active === 'queue') {
    state.queue = [...state.queue].reverse();
    addLog('Queue reversed');
  } else {
    state.linked = [...state.linked].reverse();
    addLog('Linked list reversed');
  }

  clearHighlights();
  setStatus(`${structureInfo[state.active].title} reversed.`);
  renderVisualization();
}

async function animateSearch(path, foundId) {
  searchInProgress = true;
  state.activeNodeId = null;
  state.foundNodeId = null;

  for (const nodeId of path) {
    state.activeNodeId = nodeId;
    renderVisualization();
    await new Promise((resolve) => setTimeout(resolve, 360));
  }

  state.activeNodeId = null;
  state.foundNodeId = foundId;
  renderVisualization();
  searchInProgress = false;
}

function clearHighlights() {
  state.activeNodeId = null;
  state.foundNodeId = null;
}

function inorder(node, output) {
  if (!node) return;
  inorder(node.left, output);
  output.push(node.value);
  inorder(node.right, output);
}

function preorder(node, output) {
  if (!node) return;
  output.push(node.value);
  preorder(node.left, output);
  preorder(node.right, output);
}

function postorder(node, output) {
  if (!node) return;
  postorder(node.left, output);
  postorder(node.right, output);
  output.push(node.value);
}

function levelorder(root) {
  if (!root) return [];
  const queue = [root];
  const output = [];

  while (queue.length) {
    const node = queue.shift();
    output.push(node.value);
    if (node.left) queue.push(node.left);
    if (node.right) queue.push(node.right);
  }

  return output;
}

function computeTraversal(modeName) {
  const output = [];

  if (modeName === 'In-order') {
    inorder(state.bst, output);
    return output;
  }

  if (modeName === 'Pre-order') {
    preorder(state.bst, output);
    return output;
  }

  if (modeName === 'Post-order') {
    postorder(state.bst, output);
    return output;
  }

  return levelorder(state.bst);
}

function handleTraverse() {
  if (state.active !== 'bst') return;

  if (!state.bst) {
    setStatus('BST is empty. Insert nodes first.');
    setTraversalOutput('');
    return;
  }

  const mode = traversalModes[traversalModeIndex];
  const sequence = computeTraversal(mode);
  setTraversalOutput(`${mode}: ${sequence.join(' -> ')}`);
  setStatus(`Traversal computed (${mode}).`);
  addLog(`BST traversal ${mode.toLowerCase()}`);
  traversalModeIndex = (traversalModeIndex + 1) % traversalModes.length;
}

function handleRebalance() {
  if (state.active !== 'bst') {
    setStatus('BST rebalancing is only available in the BST view.');
    return;
  }

  const values = collectBSTValues(state.bst);
  if (values.length < 3) {
    setStatus('Need at least three BST nodes before rebalancing changes anything.');
    return;
  }

  clearHighlights();
  captureSnapshot();
  state.bst = buildBalancedBST(values);
  setTraversalOutput('');
  renderVisualization();
  setStatus(`Rebuilt the BST into a more balanced shape across ${values.length} nodes.`);
  addLog('BST rebalanced from in-order values');
}

function handleAdd() {
  const value = parseInputValue();
  if (value === null) {
    setStatus('Enter a valid integer first.');
    return;
  }

  clearHighlights();
  captureSnapshot();

  if (state.active === 'stack') {
    state.stack.push({ id: nextNodeId(), value });
    setStatus(`Pushed ${value} onto stack.`);
    addLog(`Stack push ${value}`);
  } else if (state.active === 'queue') {
    state.queue.push({ id: nextNodeId(), value });
    setStatus(`Enqueued ${value}.`);
    addLog(`Queue enqueue ${value}`);
  } else if (state.active === 'linked') {
    state.linked.push({ id: nextNodeId(), value });
    setStatus(`Appended ${value} to linked list.`);
    addLog(`Linked append ${value}`);
  } else {
    const result = insertBST(state.bst, value);
    state.bst = result.node;
    setTraversalOutput('');
    if (result.inserted) {
      setStatus(`Inserted ${value} into BST.`);
      addLog(`BST insert ${value}`);
    } else {
      setStatus(`Value ${value} already exists in BST.`);
      addLog(`BST insert skipped for duplicate ${value}`);
    }
  }

  renderVisualization();
  valueInput.value = '';
  valueInput.focus();
}

function handleRemove() {
  captureSnapshot();

  if (state.active === 'stack') {
    if (!state.stack.length) {
      setStatus('Stack is empty.');
      return;
    }

    const removed = state.stack.pop();
    setStatus(`Popped ${removed.value} from stack.`);
    addLog(`Stack pop ${removed.value}`);
  } else if (state.active === 'queue') {
    if (!state.queue.length) {
      setStatus('Queue is empty.');
      return;
    }

    const removed = state.queue.shift();
    setStatus(`Dequeued ${removed.value}.`);
    addLog(`Queue dequeue ${removed.value}`);
  } else if (state.active === 'linked') {
    if (!state.linked.length) {
      setStatus('Linked list is empty.');
      return;
    }

    const removed = state.linked.shift();
    setStatus(`Removed head node (${removed.value}).`);
    addLog(`Linked remove-head ${removed.value}`);
  } else {
    const value = parseInputValue();
    if (value === null) {
      setStatus('Enter a valid integer to delete from BST.');
      return;
    }

    const result = deleteBST(state.bst, value);
    state.bst = result.node;
    setTraversalOutput('');

    if (result.deleted) {
      setStatus(`Deleted ${value} from BST.`);
      addLog(`BST delete ${value}`);
    } else {
      setStatus(`${value} was not found in BST.`);
      addLog(`BST delete miss ${value}`);
    }
  }

  clearHighlights();
  renderVisualization();
}

function handleLoadSequence() {
  const values = parseSequenceValues();
  if (!values) {
    setStatus('Enter a comma- or space-separated integer sequence first.');
    return;
  }

  clearHighlights();
  captureSnapshot();
  setTraversalOutput('');

  if (state.active === 'stack') {
    state.stack = [...state.stack, ...values.map((value) => ({ id: nextNodeId(), value }))];
    addLog(`Loaded ${values.length} value${values.length === 1 ? '' : 's'} into stack.`);
  } else if (state.active === 'queue') {
    state.queue = [...state.queue, ...values.map((value) => ({ id: nextNodeId(), value }))];
    addLog(`Loaded ${values.length} value${values.length === 1 ? '' : 's'} into queue.`);
  } else if (state.active === 'linked') {
    state.linked = [...state.linked, ...values.map((value) => ({ id: nextNodeId(), value }))];
    addLog(`Loaded ${values.length} value${values.length === 1 ? '' : 's'} into linked list.`);
  } else {
    let inserted = 0;
    values.forEach((value) => {
      const result = insertBST(state.bst, value);
      state.bst = result.node;
      if (result.inserted) inserted += 1;
    });
    addLog(`Loaded BST sequence: inserted ${inserted}/${values.length} unique value${values.length === 1 ? '' : 's'}.`);
  }

  persistState();
  renderVisualization();
  updateMetrics();
  setStatus(
    state.active === 'bst'
      ? `Loaded ${values.length} values into the BST. Duplicate inserts were ignored.`
      : `Loaded ${values.length} values into the ${structureInfo[state.active].title.toLowerCase()}.`
  );
}

async function handleSearch() {
  const value = parseInputValue();
  if (state.active !== 'bst') {
    if (value === null) {
      setStatus('Enter a valid integer to search in the active structure.');
      return;
    }

    const values = state.active === 'stack' ? state.stack : state.active === 'queue' ? state.queue : state.linked;
    if (!values.length) {
      setStatus(`${structureInfo[state.active].title} is empty.`);
      return;
    }

    const foundItem = values.find((item) => item.value === value);
    clearHighlights();
    if (foundItem) {
      state.activeNodeId = foundItem.id;
      state.foundNodeId = foundItem.id;
      setStatus(`Found ${value} in ${structureInfo[state.active].title.toLowerCase()}.`);
      addLog(`${state.active} search hit ${value}`);
    } else {
      setStatus(`${value} not found in ${structureInfo[state.active].title.toLowerCase()}.`);
      addLog(`${state.active} search miss ${value}`);
    }
    renderVisualization();
    return;
  }

  if (searchInProgress) return;
  if (value === null) {
    setStatus('Enter a valid integer to search in BST.');
    return;
  }

  if (!state.bst) {
    setStatus('BST is empty. Insert values first.');
    return;
  }

  const { path, foundId } = buildSearchPath(state.bst, value);
  setStatus(`Searching for ${value}...`);
  addLog(`BST search ${value}`);
  await animateSearch(path, foundId);

  if (foundId) {
    setStatus(`Found ${value} in BST.`);
  } else {
    setStatus(`${value} not found in BST.`);
  }
}

function handleClear() {
  captureSnapshot();

  if (state.active === 'stack') {
    state.stack = [];
    setStatus('Stack cleared.');
    addLog('Stack cleared');
  } else if (state.active === 'queue') {
    state.queue = [];
    setStatus('Queue cleared.');
    addLog('Queue cleared');
  } else if (state.active === 'linked') {
    state.linked = [];
    setStatus('Linked list cleared.');
    addLog('Linked list cleared');
  } else {
    state.bst = null;
    setTraversalOutput('');
    setStatus('BST cleared.');
    addLog('BST cleared');
  }

  clearHighlights();
  renderVisualization();
}

function handleSampleLoad() {
  captureSnapshot();
  clearHighlights();
  setTraversalOutput('');
  traversalModeIndex = 0;

  if (state.active === 'stack') {
    state.stack = [14, 27, 33, 41, 52].map((value) => ({ id: nextNodeId(), value }));
    setStatus('Loaded sample stack.');
    addLog('Stack sample loaded');
  } else if (state.active === 'queue') {
    state.queue = [11, 18, 29, 36, 45].map((value) => ({ id: nextNodeId(), value }));
    setStatus('Loaded sample queue.');
    addLog('Queue sample loaded');
  } else if (state.active === 'linked') {
    state.linked = [5, 12, 19, 28, 34].map((value) => ({ id: nextNodeId(), value }));
    setStatus('Loaded sample linked list.');
    addLog('Linked list sample loaded');
  } else {
    const sample = [40, 24, 62, 15, 31, 51, 78, 27];
    state.bst = null;
    sample.forEach((value) => {
      const result = insertBST(state.bst, value);
      state.bst = result.node;
    });
    setStatus('Loaded sample BST.');
    addLog('BST sample loaded');
  }

  renderVisualization();
}

function handleChallengeLoad() {
  captureSnapshot();
  clearHighlights();
  setTraversalOutput('');
  traversalModeIndex = 0;

  if (state.active === 'stack') {
    state.stack = [13, 21, 21, 34, 55, 89].map((value) => ({ id: nextNodeId(), value }));
    setStatus('Loaded challenge stack with repeated top pressure.');
    addLog('Stack challenge loaded');
  } else if (state.active === 'queue') {
    state.queue = [42, 18, 18, 7, 63, 90].map((value) => ({ id: nextNodeId(), value }));
    setStatus('Loaded challenge queue with mixed arrivals and repeated values.');
    addLog('Queue challenge loaded');
  } else if (state.active === 'linked') {
    state.linked = [11, 14, 14, 23, 31, 31].map((value) => ({ id: nextNodeId(), value }));
    setStatus('Loaded challenge linked list with repeated nodes for head-removal demos.');
    addLog('Linked list challenge loaded');
  } else {
    const sample = [52, 24, 16, 12, 19, 68, 61, 74, 79];
    state.bst = null;
    sample.forEach((value) => {
      const result = insertBST(state.bst, value);
      state.bst = result.node;
    });
    setStatus('Loaded challenge BST with an intentionally leaning search path.');
    addLog('BST challenge loaded');
  }

  renderVisualization();
}

function handleUndo() {
  if (!historyStack.length) {
    setStatus('Nothing to undo yet.');
    return;
  }

  redoStack.push({
    stack: [...state.stack],
    queue: [...state.queue],
    linked: [...state.linked],
    bst: cloneTree(state.bst),
    logs: [...state.logs],
  });
  const snapshot = historyStack.pop();
  applySnapshot(snapshot);
  clearHighlights();
  setTraversalOutput('');
  renderVisualization();
  setStatus('Undid last structural change.');
  addLog('Undo applied');
}

function handleRedo() {
  if (!redoStack.length) {
    setStatus('Nothing to redo yet.');
    return;
  }

  historyStack.push({
    stack: [...state.stack],
    queue: [...state.queue],
    linked: [...state.linked],
    bst: cloneTree(state.bst),
    logs: [...state.logs],
  });

  const snapshot = redoStack.pop();
  applySnapshot(snapshot);
  clearHighlights();
  setTraversalOutput('');
  renderVisualization();
  setStatus('Reapplied last undone change.');
  addLog('Redo applied');
}

function exportLog() {
  if (!state.logs.length) {
    setStatus('Log is empty. Run some operations first.');
    return;
  }

  const content = state.logs.slice().reverse().join('\\n');
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ds-playground-log-${new Date().toISOString().slice(0, 10)}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function exportState() {
  const payload = {
    active: state.active,
    stack: state.stack,
    queue: state.queue,
    linked: state.linked,
    bst: state.bst,
    logs: state.logs,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'ds-playground-workspace.json';
  link.click();
  URL.revokeObjectURL(url);
  setStatus('Exported workspace JSON.');
}

function buildDemoBrief() {
  const playbook = buildOperationPlaybook();
  const stressTest = buildStressTest();
  const snapshot = snapshotSummaryEl?.textContent || 'Load or edit a structure to inspect its current posture.';
  const chips = Array.from(snapshotChipsEl?.querySelectorAll('.snapshot-chip') || []).map((chip) => chip.textContent).join(' | ');
  return [
    `${structureInfo[state.active].title} Demo Brief`,
    '',
    `Snapshot: ${snapshot}`,
    chips ? `Signal chips: ${chips}` : 'Signal chips: Waiting for data',
    `Operator playbook: ${playbook.title}`,
    playbook.detail,
    `Watch-out: ${playbook.watch}`,
    `Stress test: ${stressTest.title}`,
    stressTest.detail,
    `Stress-test watch-out: ${stressTest.watch}`,
    `Recent log head: ${state.logs[0] || 'No operations logged yet.'}`,
    `Share link: ${window.location.href}`,
  ].join('\n');
}

function importState(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || '{}'));
      state.active = parsed.active || 'stack';
      state.stack = Array.isArray(parsed.stack) ? normalizeLinearItems(parsed.stack) : [];
      state.queue = Array.isArray(parsed.queue) ? normalizeLinearItems(parsed.queue) : [];
      state.linked = Array.isArray(parsed.linked) ? normalizeLinearItems(parsed.linked) : [];
      state.bst = parsed.bst || null;
      state.logs = Array.isArray(parsed.logs) ? parsed.logs.slice(0, 16) : [];
      logEl.innerHTML = state.logs.map((entry) => `<li>${entry}</li>`).join('');
      clearHighlights();
      setTraversalOutput('');
      traversalModeIndex = 0;
      syncNodeCounter();
      setActiveTab(state.active);
      renderVisualization();
      setStatus('Imported workspace JSON.');
    } catch (error) {
      setStatus('Could not import that JSON snapshot.');
    } finally {
      event.target.value = '';
    }
  };

  reader.readAsText(file);
}

function setActiveTab(tab) {
  state.active = tab;
  traversalModeIndex = 0;
  updateControlLabels();
  clearHighlights();
  renderVisualization();

  tabs.forEach((button) => {
    const isActive = button.dataset.tab === tab;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-selected', String(isActive));
  });

  setStatus(`${structureInfo[tab].title} selected.`);
}

function isEditableTarget(target) {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

tabs.forEach((button) => {
  button.addEventListener('click', () => setActiveTab(button.dataset.tab));
});

addBtn.addEventListener('click', handleAdd);
removeBtn.addEventListener('click', handleRemove);
loadSequenceBtn.addEventListener('click', handleLoadSequence);
searchBtn.addEventListener('click', handleSearch);
traverseBtn.addEventListener('click', handleTraverse);
rebalanceBtn.addEventListener('click', handleRebalance);
reverseBtn.addEventListener('click', handleReverse);
clearBtn.addEventListener('click', handleClear);
undoBtn.addEventListener('click', handleUndo);
redoBtn.addEventListener('click', handleRedo);
exportStateBtn.addEventListener('click', exportState);
shareStateBtn.addEventListener('click', async () => {
  syncUrlState();
  try {
    await navigator.clipboard.writeText(window.location.href);
    setStatus('Share link copied with the current workspace snapshot.');
  } catch (error) {
    setStatus('Clipboard copy failed in this environment.');
  }
});
copyDemoBriefBtn?.addEventListener('click', async () => {
  syncUrlState();
  try {
    await navigator.clipboard.writeText(buildDemoBrief());
    setStatus('Copied a demo brief with the current structure snapshot and operator playbook.');
  } catch (error) {
    setStatus('Clipboard copy failed in this environment.');
  }
});
importStateBtn.addEventListener('click', () => importStateFile.click());
importStateFile.addEventListener('change', importState);
exportLogBtn.addEventListener('click', exportLog);
sampleBtn.addEventListener('click', handleSampleLoad);
challengeBtn.addEventListener('click', handleChallengeLoad);

valueInput.addEventListener('input', renderOperationPreview);
valueInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    handleAdd();
  }
});

sequenceInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter' && event.shiftKey) {
    event.preventDefault();
    handleLoadSequence();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey || isEditableTarget(event.target)) {
    return;
  }

  if (['1', '2', '3', '4'].includes(event.key)) {
    event.preventDefault();
    const nextTab = ['stack', 'queue', 'linked', 'bst'][Number(event.key) - 1];
    setActiveTab(nextTab);
    return;
  }

  if (event.key === '5') {
    event.preventDefault();
    handleChallengeLoad();
    return;
  }

  if (event.key.toLowerCase() === 'z') {
    event.preventDefault();
    handleUndo();
    return;
  }

  if (event.key.toLowerCase() === 'y') {
    event.preventDefault();
    handleRedo();
  }
});

updateControlLabels();
const restoredFromUrl = hydrateFromUrlState();
const restored = restoredFromUrl || restoreState();
setActiveTab(state.active);
renderVisualization();
if (restoredFromUrl) {
  setStatus('Loaded workspace snapshot from the URL.');
} else if (restored) {
  setStatus('Restored your previous workspace state.');
} else {
  addLog('Playground initialized');
}
