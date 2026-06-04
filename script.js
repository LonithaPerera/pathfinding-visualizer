const ROWS = 22, COLS = 45;
let startNode = { r:11, c:5 };
let endNode   = { r:11, c:39 };
let grid = [];
let isRunning = false;
let drawMode  = 'wall';
let isMouseDown = false;
let diagonalMode = false;

function makeNode(r, c) {
  return {
    r, c,
    isWall: false, weight: 1,
    isStart: r===startNode.r && c===startNode.c,
    isEnd:   r===endNode.r   && c===endNode.c,
    g: Infinity, h: 0, f: Infinity, dist: Infinity,
    visited: false, visitedB: false, prev: null, prevB: null,
    el: null,
  };
}

function buildGrid() {
  grid = Array.from({ length:ROWS }, (_,r) => Array.from({ length:COLS }, (_,c) => makeNode(r,c)));
  const container = document.getElementById('grid');
  container.style.gridTemplateColumns = `repeat(${COLS}, 22px)`;
  container.innerHTML = '';
  grid.flat().forEach(node => {
    const el = document.createElement('div');
    el.className = 'cell';
    if (node.isStart) el.classList.add('start');
    if (node.isEnd)   el.classList.add('end');
    node.el = el;
    el.addEventListener('mousedown', () => { isMouseDown=true; handleCell(node); });
    el.addEventListener('mouseover', () => { if(isMouseDown) handleCell(node); });
    container.appendChild(el);
  });
}

function handleCell(node) {
  if (isRunning) return;
  if (node.isStart || node.isEnd) return;

  if (drawMode === 'wall') {
    node.isWall = !node.isWall; node.weight = 1;
    node.el.classList.toggle('wall', node.isWall);
    node.el.classList.remove('weighted');
  } else if (drawMode === 'weight') {
    node.isWall = false;
    node.weight = node.weight === 1 ? 5 : 1;
    node.el.classList.toggle('weighted', node.weight > 1);
    node.el.classList.remove('wall');
  } else if (drawMode === 'erase') {
    node.isWall = false; node.weight = 1;
    node.el.classList.remove('wall','weighted');
  } else if (drawMode === 'start') {
    const old = grid[startNode.r][startNode.c]; old.isStart=false; old.el.classList.remove('start');
    startNode={r:node.r,c:node.c}; node.isStart=true; node.el.classList.add('start');
  } else if (drawMode === 'end') {
    const old = grid[endNode.r][endNode.c]; old.isEnd=false; old.el.classList.remove('end');
    endNode={r:node.r,c:node.c}; node.isEnd=true; node.el.classList.add('end');
  }
}

document.addEventListener('mouseup', () => { isMouseDown=false; });

function resetSearch() {
  grid.flat().forEach(node => {
    node.g=Infinity; node.h=0; node.f=Infinity; node.dist=Infinity;
    node.visited=false; node.visitedB=false; node.prev=null; node.prevB=null;
    node.el.classList.remove('visited','visited2','path');
  });
  document.getElementById('visitedCount').textContent='0';
  document.getElementById('pathLen').textContent='—';
}

function clearPath() {
  grid.flat().forEach(node => {
    node.g=Infinity; node.h=0; node.f=Infinity; node.dist=Infinity;
    node.visited=false; node.visitedB=false; node.prev=null; node.prevB=null;
    node.el.classList.remove('visited','visited2','path');
  });
  document.getElementById('visitedCount').textContent='0';
  document.getElementById('pathLen').textContent='—';
}

function clearAll() {
  grid.flat().forEach(node => {
    node.isWall=false; node.weight=1;
    node.el.className='cell';
    if(node.isStart) node.el.classList.add('start');
    if(node.isEnd)   node.el.classList.add('end');
  });
  clearPath();
}

function heuristic(a, b) {
  if (diagonalMode) return Math.max(Math.abs(a.r-b.r), Math.abs(a.c-b.c));
  return Math.abs(a.r-b.r) + Math.abs(a.c-b.c);
}

function neighbours(node, reversed=false) {
  const dirs = diagonalMode
    ? [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[-1,1],[1,-1],[1,1]]
    : [[-1,0],[1,0],[0,-1],[0,1]];
  return dirs.map(([dr,dc]) => grid[node.r+dr]?.[node.c+dc]).filter(n => n && !n.isWall);
}

// ── Min-heap ──────────────────────────────────────────────────
class MinHeap {
  constructor(keyFn) { this.data=[]; this.key=keyFn; }
  push(item) { this.data.push(item); this._up(this.data.length-1); }
  pop() { const top=this.data[0], last=this.data.pop(); if(this.data.length){this.data[0]=last;this._down(0);} return top; }
  get size() { return this.data.length; }
  _up(i) { while(i>0){const p=(i-1)>>1; if(this.key(this.data[p])<=this.key(this.data[i]))break; [this.data[i],this.data[p]]=[this.data[p],this.data[i]]; i=p;} }
  _down(i) { const n=this.data.length; while(true){let m=i,l=2*i+1,r=2*i+2; if(l<n&&this.key(this.data[l])<this.key(this.data[m]))m=l; if(r<n&&this.key(this.data[r])<this.key(this.data[m]))m=r; if(m===i)break; [this.data[i],this.data[m]]=[this.data[m],this.data[i]]; i=m;} }
}

// ── Algorithms ────────────────────────────────────────────────
function runAstar() {
  const sn=grid[startNode.r][startNode.c], en=grid[endNode.r][endNode.c];
  sn.g=0; sn.f=heuristic(sn,en);
  const open=new MinHeap(n=>n.f); open.push(sn); const order=[];
  while(open.size) {
    const cur=open.pop(); if(cur.visited) continue; cur.visited=true; order.push(cur); if(cur===en) break;
    for(const nb of neighbours(cur)) { const g=cur.g+nb.weight; if(g<nb.g){nb.g=g;nb.h=heuristic(nb,en);nb.f=g+nb.h;nb.prev=cur;open.push(nb);} }
  }
  return { order, order2:[], end:en, meetNode:null };
}

function runDijkstra() {
  const sn=grid[startNode.r][startNode.c], en=grid[endNode.r][endNode.c];
  sn.dist=0; const pq=new MinHeap(n=>n.dist); pq.push(sn); const order=[];
  while(pq.size) {
    const cur=pq.pop(); if(cur.visited) continue; cur.visited=true; order.push(cur); if(cur===en) break;
    for(const nb of neighbours(cur)){const d=cur.dist+nb.weight; if(d<nb.dist){nb.dist=d;nb.prev=cur;pq.push(nb);}}
  }
  return { order, order2:[], end:en, meetNode:null };
}

function runBFS() {
  const sn=grid[startNode.r][startNode.c], en=grid[endNode.r][endNode.c];
  sn.visited=true; const queue=[sn]; const order=[];
  while(queue.length) {
    const cur=queue.shift(); order.push(cur); if(cur===en) break;
    for(const nb of neighbours(cur)){if(!nb.visited){nb.visited=true;nb.prev=cur;queue.push(nb);}}
  }
  return { order, order2:[], end:en, meetNode:null };
}

function runDFS() {
  const sn=grid[startNode.r][startNode.c], en=grid[endNode.r][endNode.c];
  const stack=[sn]; const order=[];
  while(stack.length) {
    const cur=stack.pop(); if(cur.visited) continue; cur.visited=true; order.push(cur); if(cur===en) break;
    for(const nb of neighbours(cur)){if(!nb.visited){nb.prev=cur;stack.push(nb);}}
  }
  return { order, order2:[], end:en, meetNode:null };
}

function runGreedy() {
  const sn=grid[startNode.r][startNode.c], en=grid[endNode.r][endNode.c];
  sn.h=heuristic(sn,en); const open=new MinHeap(n=>n.h); open.push(sn); const order=[];
  while(open.size) {
    const cur=open.pop(); if(cur.visited) continue; cur.visited=true; order.push(cur); if(cur===en) break;
    for(const nb of neighbours(cur)){if(!nb.visited){nb.h=heuristic(nb,en);nb.prev=cur;open.push(nb);}}
  }
  return { order, order2:[], end:en, meetNode:null };
}

function runBidiBFS() {
  const sn=grid[startNode.r][startNode.c], en=grid[endNode.r][endNode.c];
  sn.visited=true; en.visitedB=true;
  const qF=[sn], qB=[en];
  const order=[], order2=[];
  let meetNode=null;

  while(qF.length && qB.length) {
    // Forward step
    if(qF.length){
      const cur=qF.shift(); order.push(cur);
      for(const nb of neighbours(cur)){
        if(!nb.visited){nb.visited=true;nb.prev=cur;qF.push(nb);}
        if(nb.visitedB){meetNode=nb; break;}
      }
    }
    if(meetNode) break;
    // Backward step
    if(qB.length){
      const cur=qB.shift(); order2.push(cur);
      for(const nb of neighbours(cur)){
        if(!nb.visitedB){nb.visitedB=true;nb.prevB=cur;qB.push(nb);}
        if(nb.visited){meetNode=nb; break;}
      }
    }
    if(meetNode) break;
  }
  return { order, order2, end:en, meetNode };
}

// ── Trace path ────────────────────────────────────────────────
function getPath(endNode) {
  const path=[]; let cur=endNode; while(cur){path.unshift(cur);cur=cur.prev;} return path;
}

function getBidiPath(meetNode) {
  const fwd=[], bwd=[];
  let cur=meetNode; while(cur){fwd.unshift(cur);cur=cur.prev;}
  cur=meetNode.prevB; while(cur){bwd.push(cur);cur=cur.prevB;}
  return [...fwd,...bwd];
}

// ── Animate ───────────────────────────────────────────────────
async function animate({ order, order2, end, meetNode }, delay) {
  const sn=grid[startNode.r][startNode.c], en=grid[endNode.r][endNode.c];
  let visited=0;

  // Interleave forward and backward for bidirectional
  const maxLen=Math.max(order.length, order2.length);
  for(let i=0;i<maxLen;i++){
    if(i<order.length){
      const node=order[i]; if(node!==sn&&node!==en){node.el.classList.add('visited');visited++;}
      document.getElementById('visitedCount').textContent=visited;
    }
    if(i<order2.length){
      const node=order2[i]; if(node!==sn&&node!==en){node.el.classList.add('visited2');visited++;}
      document.getElementById('visitedCount').textContent=visited;
    }
    if(delay>0) await sleep(delay);
  }

  if(delay>0) await sleep(150);

  const path = meetNode ? getBidiPath(meetNode) : getPath(end);
  const found = meetNode ? true : path[path.length-1]===en;

  if(found){
    for(const node of path){
      if(node===sn||node===en) continue;
      node.el.classList.remove('visited','visited2');
      node.el.classList.add('path');
      if(delay>0) await sleep(delay*2.5);
    }
    document.getElementById('pathLen').textContent=path.length;
  } else {
    document.getElementById('pathLen').textContent='No path found';
  }
}

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

async function visualize() {
  if(isRunning) return;
  isRunning=true; document.getElementById('startBtn').disabled=true;
  clearPath();
  const delay=parseInt(document.getElementById('speed').value);
  const algo=document.getElementById('algorithm').value;
  const runners={astar:runAstar,dijkstra:runDijkstra,bfs:runBFS,dfs:runDFS,greedy:runGreedy,bidibfs:runBidiBFS};
  const result=runners[algo]();
  await animate(result,delay);
  isRunning=false; document.getElementById('startBtn').disabled=false;
}

// ── Maze ─────────────────────────────────────────────────────
function generateMaze() {
  if(isRunning) return;
  clearAll();
  for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++) {
    if(r===0||r===ROWS-1||c===0||c===COLS-1) {
      if(!grid[r][c].isStart&&!grid[r][c].isEnd){grid[r][c].isWall=true;grid[r][c].el.classList.add('wall');}
    }
  }
  divide(1,1,ROWS-2,COLS-2);
}

function divide(rS,cS,rE,cE) {
  const h=rE-rS, w=cE-cS;
  if(h<2||w<2) return;
  const horiz=h>w?true:w>h?false:Math.random()<0.5;
  if(horiz){
    const wR=rS+Math.floor(Math.random()*Math.floor(h/2))*2+1;
    const gC=cS+Math.floor(Math.random()*Math.ceil(w/2))*2;
    for(let c=cS;c<=cE;c++){if(c===gC)continue;const n=grid[wR]?.[c];if(n&&!n.isStart&&!n.isEnd){n.isWall=true;n.el.classList.add('wall');}}
    divide(rS,cS,wR-1,cE); divide(wR+1,cS,rE,cE);
  } else {
    const wC=cS+Math.floor(Math.random()*Math.floor(w/2))*2+1;
    const gR=rS+Math.floor(Math.random()*Math.ceil(h/2))*2;
    for(let r=rS;r<=rE;r++){if(r===gR)continue;const n=grid[r]?.[wC];if(n&&!n.isStart&&!n.isEnd){n.isWall=true;n.el.classList.add('wall');}}
    divide(rS,cS,rE,wC-1); divide(rS,wC+1,rE,cE);
  }
}

// ── Events ────────────────────────────────────────────────────
document.getElementById('startBtn').addEventListener('click', visualize);
document.getElementById('clearBtn').addEventListener('click', () => { if(!isRunning) clearAll(); });
document.getElementById('clearPathBtn').addEventListener('click', () => { if(!isRunning) clearPath(); });
document.getElementById('mazeBtn').addEventListener('click', generateMaze);
document.getElementById('diagonalToggle').addEventListener('change', e => { diagonalMode=e.target.checked; });

document.querySelectorAll('.mode-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.mode-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active'); drawMode=btn.dataset.mode;
  });
});

const ALGO_LABELS = {
  astar:'A* — weighted, optimal', dijkstra:"Dijkstra's — weighted, optimal",
  bfs:'BFS — unweighted, optimal', dfs:'DFS — unweighted, not optimal',
  greedy:'Greedy Best-First — fast, not always optimal',
  bidibfs:'Bidirectional BFS — searches from both ends simultaneously',
};

document.getElementById('algorithm').addEventListener('change', e => {
  document.getElementById('algoLabel').textContent=ALGO_LABELS[e.target.value];
});

document.getElementById('algoLabel').textContent=ALGO_LABELS['astar'];

buildGrid();
