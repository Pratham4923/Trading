let trades = JSON.parse(localStorage.getItem('terminal_elite')) || [];
let startBal = 100000;
let charts = {};

function openModal() {
    const m = document.getElementById('modal-overlay');
    m.style.display = 'flex';
    setTimeout(() => m.classList.add('active'), 10);
}

function closeModal() {
    const m = document.getElementById('modal-overlay');
    m.classList.remove('active');
    setTimeout(() => m.style.display = 'none', 400);
}

function confirmEntry() {
    const sym = document.getElementById('in-sym').value;
    const pro = document.getElementById('in-pro').value;
    const strat = document.getElementById('in-strat').value;
    if(!sym || pro === "" || !strat) return alert("Missing Data");

    const btn = document.getElementById('commitBtn');
    btn.classList.add('success');
    btn.innerText = 'COMMITTED';

    const t = {
        id: Date.now(), sym: sym.toUpperCase(), type: document.getElementById('in-type').value,
        lot: parseFloat(document.getElementById('in-lot').value), pro: parseFloat(pro),
        strat: strat, day: new Date().getDate(), fullDate: new Date().toLocaleDateString()
    };
    trades.push(t);
    localStorage.setItem('terminal_elite', JSON.stringify(trades));

    setTimeout(() => {
        closeModal();
        btn.classList.remove('success');
        btn.innerText = 'SAVE TRADE';
        document.getElementById('toast').style.display = 'block';
        setTimeout(() => document.getElementById('toast').style.display = 'none', 3000);
        render();
    }, 600);
}

function deleteTrade(id) {
    trades = trades.filter(t => t.id !== id);
    localStorage.setItem('terminal_elite', JSON.stringify(trades));
    render();
}

function render() {
    const table = document.querySelector('#trade-table tbody');
    const calendar = document.getElementById('calendar-body');
    table.innerHTML = ''; calendar.innerHTML = '';
    
    let net = 0, eq = [startBal], dayMap = {}, stratMap = {};
    ['S','M','T','W','T','F','S'].forEach(d => calendar.insertAdjacentHTML('beforeend', `<div style="font-size:10px; font-weight:900; color:var(--muted); text-align:center">${d}</div>`));

    trades.forEach(t => {
        net += t.pro; eq.push(startBal + net);
        dayMap[t.day] = (dayMap[t.day] || 0) + t.pro;
        stratMap[t.strat] = (stratMap[t.strat] || 0) + t.pro;
        table.insertAdjacentHTML('afterbegin', `
            <tr>
                <td>${t.sym}</td>
                <td style="color:${t.type==='BUY'?'var(--accent)':'var(--red)'}">${t.type}</td>
                <td style="opacity:0.6; font-size:12px">${t.strat}</td>
                <td style="color:${t.pro>=0?'var(--green)':'var(--red)'}">${t.pro.toFixed(2)}</td>
                <td style="font-size:12px">${t.fullDate}</td>
                <td><button class="del-btn" onclick="deleteTrade(${t.id})">🗑️</button></td>
            </tr>`);
    });

    for(let i=1; i<=31; i++) {
        const dP = dayMap[i] || 0;
        let style = dP > 0 ? 'border-color:var(--green); background:rgba(16,185,129,0.05)' : (dP < 0 ? 'border-color:var(--red); background:rgba(239,68,68,0.05)' : '');
        calendar.insertAdjacentHTML('beforeend', `<div class="cal-cell" style="${style}"><div style="font-size:10px; opacity:0.3">${i}</div><div style="font-weight:900; color:${dP>=0?'var(--green)':'var(--red)'}">${dP?Math.round(dP):''}</div></div>`);
    }

    document.getElementById('disp-bal').innerText = '$' + (startBal + net).toLocaleString();
    document.getElementById('disp-net').innerText = (net>=0?'+ ':'- ') + '$' + Math.abs(net).toLocaleString();
    document.getElementById('disp-net').style.color = net>=0 ? 'var(--green)' : 'var(--red)';
    
    updateCharts(eq, stratMap);
}

function updateCharts(eq, stratData) {
    if(charts.g) charts.g.destroy();
    charts.g = new Chart(document.getElementById('ch-growth'), {
        type: 'line', data: { labels: eq.map((_,i)=>i), datasets: [{ data: eq, borderColor: '#3b82f6', borderWidth: 4, tension: 0.3, fill: true, backgroundColor: 'rgba(59,130,246,0.05)', pointRadius: 0 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: false }, scales: { x: { display: false }, y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(255,255,255,0.02)' } } } }
    });

    if(charts.s) charts.s.destroy();
    charts.s = new Chart(document.getElementById('ch-strat'), {
        type: 'bar', data: { labels: Object.keys(stratData), datasets: [{ data: Object.values(stratData), backgroundColor: Object.values(stratData).map(v=>v>=0?'#10b981':'#ef4444'), borderRadius: 10 }] },
        options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: false }, scales: { x: { display: false }, y: { ticks: { color: '#f8fafc', font: { weight: 'bold' } } } } }
    });
}

render();
