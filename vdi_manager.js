// =====================================================================
// III. Monitoring and Utilities (The VDI Value-Add) 📊
// =====================================================================

// NOTE: datetime.now().isoformat() is Node.js/Python style. 
// We use the JavaScript equivalent for the browser environment.
class ConfigDBManager {
    /**
     * Simulates a database interface (in-memory) for persistence 
     * of configuration and runtime metrics.
     */
    constructor() {
        // Initializing simulated in-memory 'collections'
        this.vm_collection = {};     // Stores VM configuration
        this.worker_collection = {}; // Stores Worker configuration
        this.metric_collection = []; // Stores historical performance metrics
        this.next_worker_id = 1; // Simple ID counter
        this.next_vm_id = 1;
    }

    // --- Utility Methods for ID generation (simplified for the simulation) ---
    get_next_worker_id() {
        return `worker-${this.next_worker_id++}`;
    }

    get_next_vm_id() {
        return `vm-${this.next_vm_id++}`;
    }

    // --- VM Operations ---
    save_vm_config(vm_obj) {
        /** Saves or updates a VM's static configuration. */
        this.vm_collection[vm_obj.vm_id] = {
            'id': vm_obj.vm_id,
            'status': 'active',
            'ip_address': `192.168.1.${vm_obj.vm_id.split('-')[1] || 1}`,
            'pool_url': vm_obj.stratum_client ? vm_obj.stratum_client.pool_url : null
        };
        console.log(`DB: VM-${vm_obj.vm_id} config saved.`);
    }
        
    load_all_vm_configs() {
        /** Loads all persisted VM configurations. */
        return this.vm_collection;
    }
    
    // --- Worker Operations ---
    save_worker_config(worker_obj) {
        /** Saves or updates a Worker's static configuration and its parent VM ID. */
        this.worker_collection[worker_obj.worker_id] = {
            'id': worker_obj.worker_id,
            'algorithm': worker_obj.algorithm,
            'current_vm_id': worker_obj.parent_vm_id, 
            'config': worker_obj.config
        };
        console.log(`DB: Worker-${worker_obj.worker_id} config saved. VM: ${worker_obj.parent_vm_id}`);
    }

    load_workers_for_vm(vm_id) {
        /** Loads workers assigned to a specific VM ID. */
        return Object.values(this.worker_collection).filter(
            config => config.current_vm_id === vm_id
        );
    }

    // --- Metrics Operations ---
    record_metrics_snapshot(metrics_data) {
        /** Saves a timestamped snapshot of performance metrics (for historical analysis). */
        const snapshot = {
            'timestamp': new Date().toISOString(),
            'metrics': metrics_data // The dictionary from VDIMonitor
        };
        this.metric_collection.push(snapshot);
        // Limit historical metrics for this simulation
        if (this.metric_collection.length > 50) {
            this.metric_collection.shift();
        }
        console.log(`DB: Metrics snapshot saved. Total snapshots: ${this.metric_collection.length}`);
    }
}


// --- Power Usage/Efficiency Utility ---
class PowerUsageSimulator {
    /** Utility class for performance calculations. */
    static calculate_power_draw(hashrate, efficiency_joule_per_th) {
        // Convert TH/s to T
        return (hashrate * 1e12) * efficiency_joule_per_th;
    }
    
    static calculate_efficiency(hashrate, power_watts) {
        if (hashrate === 0) return Infinity;
        // Power in J/s, Hashrate in H/s
        return power_watts / (hashrate * 1e12); // J/TH
    }
}


// --- Centralized Monitoring and Reporting ---
class VDIMonitor {
    /** Gathers metrics and now persists them. */
    constructor(vdi_manager, db_manager) {
        this.vdi_manager = vdi_manager;
        this.db_manager = db_manager;
        this.metrics = {};
    }

    update_all_metrics() {
        const current_metrics_data = {};
        for (const vm of Object.values(this.vdi_manager.vms)) {
            for (const worker of vm.workers) {
                current_metrics_data[worker.worker_id] = {
                    'hashrate': worker.get_hashrate(),
                    'power_consumption': worker.get_power_consumption(),
                    'shares_accepted': Math.floor(Math.random() * 5000), // Simulated
                    'shares_rejected': Math.floor(Math.random() * 50), // Simulated
                    'temperature': Math.floor(60 + Math.random() * 20), // Simulated
                };
            }
        }
        
        this.metrics = current_metrics_data;
        this.db_manager.record_metrics_snapshot(this.metrics);
        this.updateFrontEndDisplay();
        console.log("All metrics updated and persisted.");
    }
    
    alert_on_condition(metric_key, operator, threshold) {
        // ... (existing logic for alerts)
    }

    updateFrontEndDisplay() {
        // Find the main worker's metrics (simplistic: use the first one)
        const mainWorkerId = Object.keys(this.metrics)[0];
        if (!mainWorkerId) return;

        const data = this.metrics[mainWorkerId];
        
        // Update live metrics section
        document.getElementById('current-hashrate').textContent = `${data.hashrate.toFixed(2)} TH/s`;
        document.getElementById('shares-accepted').textContent = data.shares_accepted.toString();
        // Simulating fan speed/power draw based on power_consumption
        document.getElementById('fan-speed').textContent = `${(data.power_consumption / 10).toFixed(0)} RPM`;
        document.getElementById('power-draw').textContent = `${data.power_consumption.toFixed(0)} W`;
        
        // Update detailed metrics modal (assuming the modal is visible to the user)
        document.getElementById('hashrate-24h').textContent = `${(data.hashrate * 0.95).toFixed(2)} TH/s`; // Simulated 24h avg
        document.getElementById('shares-rejected').textContent = data.shares_rejected.toString();
        document.getElementById('chip-temp').textContent = `${data.temperature} °C`;

        console.log("Front-end dashboard updated.");
    }
}


// =====================================================================
// II. Stratum and Algorithm Management (The Mining Logic) 🔗
// =====================================================================

// --- Stratum Client (Communication Management) ---
class StratumClient {
    /** Handles the persistent connection and communication with a mining pool. */
    constructor(pool_url, vm) {
        this.pool_url = pool_url;
        this.vm = vm;
        this.connection = this.connect_to_pool();
        this.current_job = null;
    }
    
    connect_to_pool() {
        console.log(`VM ${this.vm.vm_id}: Connecting to pool ${this.pool_url}...`);
        return "TCP_Connection_Object";
    }
    
    // ... (other Stratum methods remain the same)
}


// =====================================================================
// I. VDI and Resource Management (The Infrastructure Core) ⚙️
// =====================================================================

// --- Base Worker/Miner Class for Abstraction ---
class MinerWorker {
    /** Represents a physical/virtual mining device (ASIC/GPU/etc.). */
    constructor(worker_id, algorithm, parent_vm_id, db_manager) {
        this.worker_id = worker_id;
        this.algorithm = algorithm;
        this.parent_vm_id = parent_vm_id; // Track parent VM
        this.config = {};
        this.db_manager = db_manager;
        // Save initial config to DB
        this.db_manager.save_worker_config(this);
    }

    get_hashrate() {
        // Placeholder for actual API call to the miner (Simulated value)
        return 50.0 + Math.random() * 5; // TH/s
    }

    get_power_consumption() {
        // Placeholder for actual API call (Simulated value)
        return 2000 + Math.random() * 100; // Watts
    }

    update_configuration(new_config) {
        this.config.update(new_config);
        // Persist the new configuration
        this.db_manager.save_worker_config(this); 
        console.log(`Worker ${this.worker_id}: Updated config to ${new_config}`);
    }

    set_new_parent(new_vm_id) {
        /** Updates the worker's parent VM ID and persists the change. */
        this.parent_vm_id = new_vm_id;
        // **Critical Step:** Update the database immediately
        this.db_manager.save_worker_config(this); 
        console.log(`Worker ${this.worker_id}: Parent VM updated to ${new_vm_id} in DB.`);
    }
}


// --- Virtual Machine (VM) Class ---
class MiningVM {
    /** Represents an individual VDI instance hosting one or more MinerWorkers and a StratumClient. */
    constructor(vm_id, db_manager, pool_url = "default_pool") {
        this.vm_id = vm_id;
        this.workers = [];
        this.load_metric = 0.0;
        this.db_manager = db_manager;
        this.stratum_client = new StratumClient(pool_url, this); 
        
        // Save initial VM config
        this.db_manager.save_vm_config(this);
    }

    calculate_load() {
        // Load could be based on CPU usage, network I/O, or total workers
        const total_hashrate = this.workers.reduce((sum, w) => sum + w.get_hashrate(), 0);
        this.load_metric = total_hashrate / 100.0; // Simple example
        return this.load_metric;
    }

    is_overloaded(threshold = 0.8) {
        return this.calculate_load() > threshold;
    }

    migrate_worker_out(worker_id, new_vm) {
        /** Removes a worker from this VM, updates its state/DB, and adds it to the new VM. */
        const workerIndex = this.workers.findIndex(w => w.worker_id === worker_id);
        if (workerIndex === -1) {
            console.error(`Error: Worker ${worker_id} not found on VM ${this.vm_id}.`);
            return false;
        }

        const worker = this.workers[workerIndex];
        this.workers.splice(workerIndex, 1); // 1. Remove the worker object
        
        worker.set_new_parent(new_vm.vm_id); // 2. Update worker's parent and DB
        new_vm.workers.push(worker);         // 3. Add to the destination VM

        console.log(`Migration Success: Worker ${worker_id} moved from VM **${this.vm_id}** to VM **${new_vm.vm_id}**.`);
        
        // IMPORTANT: In a real system, signal the new VM's StratumClient 
        // to take over the connection or re-establish it.
        return true;
    }
}

// --- VDI Manager Class (Resource Allocation and Scalability) ---
class VDIManager {
    /** Manages the pool of Virtual Machines and handles rebalancing. */
    constructor(db_manager) {
        this.db_manager = db_manager;
        this.vms = {}; 
        this.initialize_vms_from_db(); 
    }

    initialize_vms_from_db() {
        /** Rebuilds the VDI state from the database records or creates initial state. */
        const vm_configs = this.db_manager.load_all_vm_configs();
        
        if (Object.keys(vm_configs).length === 0) {
            console.log("No existing VMs found in DB, spinning up initial VM and worker.");
            const vm = this.spin_up_new_vm("stratum+tcp://stratum.braiins.com:3333");
            new MinerWorker(
                "ron47ron1.mining_btc", // Using the ID from your HTML
                "SHA-256", 
                vm.vm_id, 
                this.db_manager
            ).config = { initial: true };
            vm.workers.push(Object.values(this.db_manager.worker_collection)[0]);
            
            this.db_manager.next_worker_id = 2;
            this.db_manager.next_vm_id = 2;
            
        } else {
            // 1. Recreate VMs
            for (const vm_config of Object.values(vm_configs)) {
                const vm = new MiningVM(vm_config.id, this.db_manager, vm_config.pool_url);
                this.vms[vm.vm_id] = vm;
                
                // 2. Recreate Workers and assign them
                const worker_configs = this.db_manager.load_workers_for_vm(vm.vm_id);
                for (const w_config of worker_configs) {
                    const worker = new MinerWorker(
                        w_config.id, 
                        w_config.algorithm, 
                        vm.vm_id, 
                        this.db_manager
                    );
                    worker.config = w_config.config;
                    vm.workers.push(worker);
                }
            }
        }
        
        console.log(`VDIManager initialized with ${Object.keys(this.vms).length} VMs and ${Object.keys(this.db_manager.worker_collection).length} workers.`);
    }

    monitor_and_rebalance() {
        /** Checks for overloaded VMs and initiates worker migration. */
        console.log("\n--- Starting Rebalance Check ---");
        let rebalanced = false;
        for (const vm of Object.values(this.vms)) {
            if (vm.is_overloaded()) {
                rebalanced = this.rebalance_vm(vm);
                if (rebalanced) break; // Rebalance one VM at a time
            }
        }
        if (!rebalanced) console.log("No VMs currently overloaded.");
    }
    
    rebalance_vm(overloaded_vm) {
        // Find a suitable worker to move (e.g., the one using the most resources)
        if (overloaded_vm.workers.length === 0) return false;
        
        const worker_to_move = overloaded_vm.workers.reduce(
            (max, w) => (w.get_hashrate() > max.get_hashrate() ? w : max), 
            overloaded_vm.workers[0]
        );

        const new_vm = this.find_least_used_vm(overloaded_vm);

        if (new_vm) {
            return overloaded_vm.migrate_worker_out(worker_to_move.worker_id, new_vm);
        } else {
            // No suitable VM found, spin up a new one
            const new_vm_instance = this.spin_up_new_vm();
            console.log(`VM ${overloaded_vm.vm_id} overloaded, spinning up new VM ${new_vm_instance.vm_id}.`);
            // Attempt migration after new VM is ready (simulated delay)
            setTimeout(() => {
                overloaded_vm.migrate_worker_out(worker_to_move.worker_id, new_vm_instance);
                monitor.update_all_metrics(); // Update display after migration
            }, 1000); 
            return true; // Migration started (deferred)
        }
    }

    find_least_used_vm(exclude_vm) {
        /** Finds the VM with the lowest calculated load, excluding the overloaded one. */
        const eligibleVMs = Object.values(this.vms).filter(vm => vm !== exclude_vm);
        if (eligibleVMs.length === 0) return null;
        return eligibleVMs.reduce((min, vm) => (vm.load_metric < min.load_metric ? vm : min), eligibleVMs[0]);
    }

    spin_up_new_vm(pool_url = "default_pool") {
        const new_id = this.db_manager.get_next_vm_id();
        const new_vm = new MiningVM(new_id, this.db_manager, pool_url);
        this.vms[new_id] = new_vm;
        console.log(`New VM spun up: ${new_id}`);
        return new_vm;
    }

    update_pool_settings(workerId, newPoolAddress) {
        // Simple logic: find the worker and update its VM's StratumClient
        for (const vm of Object.values(this.vms)) {
            const worker = vm.workers.find(w => w.worker_id === workerId);
            if (worker) {
                vm.stratum_client.pool_url = newPoolAddress;
                this.db_manager.save_vm_config(vm); // Persist pool change
                console.log(`Worker ${workerId}'s pool address updated to ${newPoolAddress}`);
                // Update the front-end element directly
                document.getElementById('pool-address').textContent = newPoolAddress;
                return true;
            }
        }
        return false;
    }
}


// =====================================================================
// IV. Front-end Initialization and Event Handlers (Connecting to HTML) 🔗
// =====================================================================

let db_manager;
let vdi_manager;
let monitor;

function initializeApplication() {
    // 1. Initialize Core Components
    db_manager = new ConfigDBManager();
    vdi_manager = new VDIManager(db_manager);
    monitor = new VDIMonitor(vdi_manager, db_manager);

    // Initial data load and display
    monitor.update_all_metrics();

    // 2. Set up Periodic Updates (The heart of the dashboard)
    // Update metrics and check rebalance every 5 seconds
    setInterval(() => {
        monitor.update_all_metrics();
        vdi_manager.monitor_and_rebalance();
    }, 5000); 

    // 3. Set up Event Listeners for Modals and Actions
    
    // --- Modals Logic ---
    const metricsModal = document.getElementById('miningMetricsModal');
    const configModal = document.getElementById('poolConfigModal');
    
    // Open Detailed Metrics Modal
    document.getElementById('open-metrics-modal').addEventListener('click', () => {
        metricsModal.classList.remove('hidden');
    });

    // Close Detailed Metrics Modal
    document.querySelector('.close-modal-metrics').addEventListener('click', () => {
        metricsModal.classList.add('hidden');
    });

    // Open Pool Config Modal
    document.getElementById('open-config-modal').addEventListener('click', () => {
        configModal.classList.remove('hidden');
        // Pre-fill inputs with current displayed data
        document.getElementById('new-pool-input').value = document.getElementById('pool-address').textContent;
        document.getElementById('new-worker-input').value = document.getElementById('worker-id').textContent;
    });

    // Close Pool Config Modal
    document.querySelector('.close-modal-config').addEventListener('click', () => {
        configModal.classList.add('hidden');
    });
    
    // Cancel Settings Button
    document.getElementById('cancel-settings').addEventListener('click', () => {
        configModal.classList.add('hidden');
    });

    // --- Action Button Logic ---
    document.getElementById('refresh-metrics').addEventListener('click', () => {
        monitor.update_all_metrics();
    });

    document.getElementById('save-settings').addEventListener('click', () => {
        const newPoolAddress = document.getElementById('new-pool-input').value;
        const newWorkerId = document.getElementById('new-worker-input').value;
        
        // Simple validation/logic
        if (newPoolAddress) {
            // For simplicity, we assume the dashboard only controls the first worker's pool
            vdi_manager.update_pool_settings(document.getElementById('worker-id').textContent, newPoolAddress);
        }

        if (newWorkerId) {
            // Worker ID change is more complex (requires config/reconnection), 
            // but we'll update the display for user feedback.
            document.getElementById('worker-id').textContent = newWorkerId;
        }

        configModal.classList.add('hidden');
        alert('Settings saved and connection may be restarting!');
    });

    // Stratum V2 Upgrade Button
    document.getElementById('upgrade-button').addEventListener('click', () => {
        const v2Address = document.getElementById('new-pool-address').textContent;
        // In a real system, this would change the protocol, not just the address
        if (vdi_manager.update_pool_settings(document.getElementById('worker-id').textContent, v2Address)) {
             document.getElementById('v2-status').textContent = 'Status: **V2 Upgrade Initiated!**';
             document.getElementById('upgrade-button').disabled = true;
             alert('Stratum V2 Upgrade in progress!');
        }
    });

    // Close modals when clicking outside of them
    window.addEventListener('click', (event) => {
        if (event.target === metricsModal) {
            metricsModal.classList.add('hidden');
        }
        if (event.target === configModal) {
            configModal.classList.add('hidden');
        }
    });
}

// Ensure the application initializes after the entire HTML document is loaded
window.addEventListener('DOMContentLoaded', initializeApplication);
                                       
