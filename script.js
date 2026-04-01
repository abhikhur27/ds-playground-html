const tabs = Array.from(document.querySelectorAll('.tab'));
const valueInput = document.getElementById('value-input');
const addBtn = document.getElementById('add-btn');
const removeBtn = document.getElementById('remove-btn');
const searchBtn = document.getElementById('search-btn');
const traverseBtn = document.getElementById('traverse-btn');
const clearBtn = document.getElementById('clear-btn');
const undoBtn = document.getElementById('undo-btn');
const redoBtn = document.getElementById('redo-btn');
const exportStateBtn = document.getElementById('export-state-btn');
const importStateBtn = document.getElementById('import-state-btn');
const importStateFile = document.getElementById('import-state-file');
const exportLogBtn = document.getElementById('export-log-btn');
const sampleBtn = document.getElementById('sample-btn');
const statusEl = document.getElementById('status');
const traversalOutputEl = document.getElementById('traversal-output');
const metricSizeEl = document.getElementById('metric-size');
const metricHeightEl = document.getElementById('metric-height');
const logEl = document.getElementById('log');
const structureTitle = document.getElementById('structure-title');
const structureNote = document.getElementById('structure-note');
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

function restoreState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!parsed) return false;

    state.active = parsed.active || 'stack';
    state.stack = Array.isArray(parsed.stack) ? parsed.stack : [];
    state.queue = Array.isArray(parsed.queue) ? parsed.queue : [];
    state.linked = Array.isArray(parsed.linked) ? parsed.linked : [];
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

function bstHeight(node) {
  if (!node) return 0;
  return 1 + Math.max(bstHeight(node.left), bstHeight(node.right));
}

function updateMetrics() {
  if (state.active === 'stack') {
    metricSizeEl.textContent = String(state.stack.length);
    metricHeightEl.textContent = '-';
    return;
  }

  if (state.active === 'queue') {
    metricSizeEl.textContent = String(state.queue.length);
    metricHeightEl.textContent = '-';
    return;
  }

  if (state.active === 'linked') {
    metricSizeEl.textContent = String(state.linked.length);
    metricHeightEl.textContent = '-';
    return;
  }

  let count = 0;
  (function walk(node) {
    if (!node) return;
    count += 1;
    walk(node.left);
    walk(node.right);
  })(state.bst);

  metricSizeEl.textContent = String(count);
  metricHeightEl.textContent = String(bstHeight(state.bst));
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
    .map((value, index) => {
      const isTop = index === state.stack.length - 1;
      return `<div class="node ${isTop ? 'badge top' : ''}">${value}</div>`;
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
    .map((value, index) => `<div class="node ${index === 0 ? 'badge front' : ''}">${value}</div>`)
    .join('');

  visualArea.innerHTML = `<div class="node-list">${nodes}</div>`;
}

function renderLinkedList() {
  if (!state.linked.length) {
    visualArea.innerHTML = '<p class="empty">Linked list is empty. Append a value to begin.</p>';
    return;
  }

  const nodes = state.linked
    .map((value, index) => `<div class="node ${index === 0 ? 'badge list-head' : ''}">${value}</div>`)
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
    return;
  }

  if (state.active === 'queue') {
    renderQueue();
    updateMetrics();
    return;
  }

  if (state.active === 'linked') {
    renderLinkedList();
    updateMetrics();
    persistState();
    return;
  }

  renderBST();
  updateMetrics();
  persistState();
}

function updateControlLabels() {
  const info = structureInfo[state.active];
  structureTitle.textContent = info.title;
  structureNote.textContent = info.note;
  addBtn.textContent = info.addLabel;
  removeBtn.textContent = info.removeLabel;

  const isBST = state.active === 'bst';
  searchBtn.classList.toggle('hidden', !isBST);
  traverseBtn.classList.toggle('hidden', !isBST);
  if (!isBST) {
    setTraversalOutput('');
  }
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

function handleAdd() {
  const value = parseInputValue();
  if (value === null) {
    setStatus('Enter a valid integer first.');
    return;
  }

  clearHighlights();
  captureSnapshot();

  if (state.active === 'stack') {
    state.stack.push(value);
    setStatus(`Pushed ${value} onto stack.`);
    addLog(`Stack push ${value}`);
  } else if (state.active === 'queue') {
    state.queue.push(value);
    setStatus(`Enqueued ${value}.`);
    addLog(`Queue enqueue ${value}`);
  } else if (state.active === 'linked') {
    state.linked.push(value);
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
    setStatus(`Popped ${removed} from stack.`);
    addLog(`Stack pop ${removed}`);
  } else if (state.active === 'queue') {
    if (!state.queue.length) {
      setStatus('Queue is empty.');
      return;
    }

    const removed = state.queue.shift();
    setStatus(`Dequeued ${removed}.`);
    addLog(`Queue dequeue ${removed}`);
  } else if (state.active === 'linked') {
    if (!state.linked.length) {
      setStatus('Linked list is empty.');
      return;
    }

    const removed = state.linked.shift();
    setStatus(`Removed head node (${removed}).`);
    addLog(`Linked remove-head ${removed}`);
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

async function handleSearch() {
  if (state.active !== 'bst') return;
  if (searchInProgress) return;

  const value = parseInputValue();
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
    state.stack = [14, 27, 33, 41, 52];
    setStatus('Loaded sample stack.');
    addLog('Stack sample loaded');
  } else if (state.active === 'queue') {
    state.queue = [11, 18, 29, 36, 45];
    setStatus('Loaded sample queue.');
    addLog('Queue sample loaded');
  } else if (state.active === 'linked') {
    state.linked = [5, 12, 19, 28, 34];
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

function importState(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || '{}'));
      state.active = parsed.active || 'stack';
      state.stack = Array.isArray(parsed.stack) ? parsed.stack : [];
      state.queue = Array.isArray(parsed.queue) ? parsed.queue : [];
      state.linked = Array.isArray(parsed.linked) ? parsed.linked : [];
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

tabs.forEach((button) => {
  button.addEventListener('click', () => setActiveTab(button.dataset.tab));
});

addBtn.addEventListener('click', handleAdd);
removeBtn.addEventListener('click', handleRemove);
searchBtn.addEventListener('click', handleSearch);
traverseBtn.addEventListener('click', handleTraverse);
clearBtn.addEventListener('click', handleClear);
undoBtn.addEventListener('click', handleUndo);
redoBtn.addEventListener('click', handleRedo);
exportStateBtn.addEventListener('click', exportState);
importStateBtn.addEventListener('click', () => importStateFile.click());
importStateFile.addEventListener('change', importState);
exportLogBtn.addEventListener('click', exportLog);
sampleBtn.addEventListener('click', handleSampleLoad);

valueInput.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') {
    handleAdd();
  }
});

updateControlLabels();
const restored = restoreState();
setActiveTab(state.active);
renderVisualization();
if (restored) {
  setStatus('Restored your previous workspace state.');
} else {
  addLog('Playground initialized');
}
