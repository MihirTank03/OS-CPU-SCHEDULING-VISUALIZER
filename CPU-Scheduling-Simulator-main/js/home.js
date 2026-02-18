// ========== Home Page - Process Manager JavaScript ==========

let processes = [];
let simulationResults = null;

// Navigation Functions
function showMenu() {
    document.getElementById("navLinks").style.right = "0";
}

function hideMenu() {
    document.getElementById("navLinks").style.right = "-200px";
}

// Add Process Event Listener
document.addEventListener("DOMContentLoaded", function() {
    const processForm = document.getElementById("processForm");
    if (processForm) {
        processForm.addEventListener("submit", function(e) {
            e.preventDefault();
            
            const processId = document.getElementById("processId").value;
            if (processes.some(p => p.id === processId)) {
                alert("Process ID already exists!");
                return;
            }

            const process = {
                id: processId,
                arrivalTime: parseInt(document.getElementById("arrivalTime").value),
                burstTime: parseInt(document.getElementById("burstTime").value),
                priority: parseInt(document.getElementById("priority").value) || 1
            };

            processes.push(process);
            renderProcessTable();
            this.reset();
        });
    }
});

// Render Process Table
function renderProcessTable() {
    const tbody = document.getElementById("processTableBody");
    
    if (processes.length === 0) {
        tbody.innerHTML = '<tr class="empty-row"><td colspan="5"><i class="fas fa-inbox"></i> No processes added yet</td></tr>';
        return;
    }

    tbody.innerHTML = processes.map((proc, idx) => `
        <tr class="process-row">
            <td><span class="badge">${proc.id}</span></td>
            <td>${proc.arrivalTime}</td>
            <td>${proc.burstTime}</td>
            <td><span class="priority-badge">${proc.priority}</span></td>
            <td>
                <button class="btn-icon delete-btn" onclick="deleteProcess(${idx})" title="Delete">
                    <i class="fas fa-trash-alt"></i>
                </button>
            </td>
        </tr>
    `).join("");
}

// Delete Process
function deleteProcess(idx) {
    processes.splice(idx, 1);
    renderProcessTable();
}

// Clear All Processes
function clearAllProcesses() {
    if (processes.length > 0 && confirm("Are you sure you want to clear all processes?")) {
        processes = [];
        simulationResults = null;
        renderProcessTable();
        resetStatistics();
    }
}

// Export Data
function exportData() {
    if (processes.length === 0) {
        alert("No processes to export!");
        return;
    }
    const jsonData = JSON.stringify(processes, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'processes.json';
    a.click();
}

// Reset Statistics Display
function resetStatistics() {
    document.getElementById("totalProcesses").textContent = processes.length;
    document.getElementById("avgWaitTime").textContent = "0";
    document.getElementById("avgTurnaroundTime").textContent = "0";
    document.getElementById("cpuUtilization").textContent = "0%";
}

// ========== SCHEDULING ALGORITHMS ==========

// FCFS - First Come First Serve
function fcfs(processList) {
    const sorted = [...processList].sort((a, b) => a.arrivalTime - b.arrivalTime);
    let currentTime = 0;
    const results = sorted.map(p => {
        const startTime = Math.max(currentTime, p.arrivalTime);
        const endTime = startTime + p.burstTime;
        const waitTime = startTime - p.arrivalTime;
        const turnaroundTime = endTime - p.arrivalTime;
        currentTime = endTime;
        return { ...p, waitTime, turnaroundTime };
    });
    return results;
}

// SJF - Shortest Job First (Non-preemptive)
function sjf(processList) {
    const sorted = [...processList].sort((a, b) => a.arrivalTime - b.arrivalTime);
    let currentTime = 0;
    const completed = [];
    const remaining = [...sorted];
    
    while (remaining.length > 0) {
        const available = remaining.filter(p => p.arrivalTime <= currentTime);
        if (available.length === 0) {
            currentTime = remaining[0].arrivalTime;
        } else {
            const shortest = available.reduce((min, p) => p.burstTime < min.burstTime ? p : min);
            const startTime = Math.max(currentTime, shortest.arrivalTime);
            const endTime = startTime + shortest.burstTime;
            const waitTime = startTime - shortest.arrivalTime;
            const turnaroundTime = endTime - shortest.arrivalTime;
            completed.push({ ...shortest, waitTime, turnaroundTime });
            currentTime = endTime;
            remaining.splice(remaining.indexOf(shortest), 1);
        }
    }
    return completed;
}

// Priority Scheduling (Non-preemptive, lower priority number = higher priority)
function priorityScheduling(processList) {
    const sorted = [...processList].sort((a, b) => a.arrivalTime - b.arrivalTime);
    let currentTime = 0;
    const completed = [];
    const remaining = [...sorted];
    
    while (remaining.length > 0) {
        const available = remaining.filter(p => p.arrivalTime <= currentTime);
        if (available.length === 0) {
            currentTime = remaining[0].arrivalTime;
        } else {
            const highest = available.reduce((max, p) => p.priority < max.priority ? p : max);
            const startTime = Math.max(currentTime, highest.arrivalTime);
            const endTime = startTime + highest.burstTime;
            const waitTime = startTime - highest.arrivalTime;
            const turnaroundTime = endTime - highest.arrivalTime;
            completed.push({ ...highest, waitTime, turnaroundTime });
            currentTime = endTime;
            remaining.splice(remaining.indexOf(highest), 1);
        }
    }
    return completed;
}

// Round Robin
function roundRobin(processList, timeQuantum = 4) {
    const queue = [...processList].map(p => ({ ...p, remainingTime: p.burstTime }));
    let currentTime = 0;
    const results = [];
    
    while (queue.length > 0) {
        const p = queue.shift();
        
        if (p.arrivalTime > currentTime) {
            currentTime = p.arrivalTime;
        }
        
        const executeTime = Math.min(p.remainingTime, timeQuantum);
        currentTime += executeTime;
        p.remainingTime -= executeTime;
        
        if (p.remainingTime > 0) {
            queue.push(p);
        } else {
            const turnaroundTime = currentTime - p.arrivalTime;
            const waitTime = turnaroundTime - p.burstTime;
            results.push({ ...p, waitTime, turnaroundTime });
        }
    }
    return results;
}

// Pre-emptive SJF
function preemptiveSJF(processList) {
    const timeline = [...processList].map(p => ({ ...p, remainingTime: p.burstTime }));
    let currentTime = 0;
    const results = [];
    
    while (timeline.length > 0) {
        const available = timeline.filter(p => p.arrivalTime <= currentTime);
        
        if (available.length === 0) {
            currentTime = timeline[0].arrivalTime;
            continue;
        }
        
        const shortest = available.reduce((min, p) => p.remainingTime < min.remainingTime ? p : min);
        const executeTime = 1;
        shortest.remainingTime -= executeTime;
        currentTime += executeTime;
        
        if (shortest.remainingTime === 0) {
            const turnaroundTime = currentTime - shortest.arrivalTime;
            const waitTime = turnaroundTime - shortest.burstTime;
            results.push({ ...shortest, waitTime, turnaroundTime });
            timeline.splice(timeline.indexOf(shortest), 1);
        }
    }
    return results;
}

// Run Simulation
function runSimulation() {
    if (processes.length === 0) {
        alert("Please add at least one process before running simulation!");
        return;
    }
    
    const algorithm = document.getElementById("algorithmSelect").value;
    let results;
    
    // Execute the selected algorithm
    switch(algorithm) {
        case 'fcfs':
            results = fcfs(processes);
            break;
        case 'sjf':
            results = sjf(processes);
            break;
        case 'priority':
            results = priorityScheduling(processes);
            break;
        case 'rr':
            results = roundRobin(processes, 4);
            break;
        case 'ps':
            results = preemptiveSJF(processes);
            break;
        default:
            results = fcfs(processes);
    }
    
    simulationResults = results;
    updateStatisticsFromResults(results);
}

// Update Statistics from Results
function updateStatisticsFromResults(results) {
    document.getElementById("totalProcesses").textContent = results.length;
    
    if (results.length > 0) {
        const avgWait = results.reduce((sum, p) => sum + p.waitTime, 0) / results.length;
        const avgTurnaround = results.reduce((sum, p) => sum + p.turnaroundTime, 0) / results.length;
        
        // Calculate CPU Utilization
        const totalBurst = results.reduce((sum, p) => sum + p.burstTime, 0);
        const maxEnd = Math.max(...results.map(p => p.turnaroundTime + p.arrivalTime));
        const minStart = Math.min(...results.map(p => p.arrivalTime));
        const totalTime = maxEnd - minStart;
        const utilization = totalBurst > 0 ? Math.round((totalBurst / totalTime) * 100) : 0;
        
        document.getElementById("avgWaitTime").textContent = avgWait.toFixed(1);
        document.getElementById("avgTurnaroundTime").textContent = avgTurnaround.toFixed(1);
        document.getElementById("cpuUtilization").textContent = utilization + "%";
    }
}
