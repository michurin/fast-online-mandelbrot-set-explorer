/* eslint no-plusplus: 0, no-console: 0 */

// Wery simple pool of workers
// We don't allow to add tasks task by task. We obtain only full set of tasks,
// and we drop all previos tasks at that moment.
// To invalidate outdated jobs we use generations.

// All this code is transparent for `tasks` and `results`.
// This class knows nothing about internal their structure.

// TODO: Split queue controller (could be multiply) and
// TODO: workers manager (singleton) to be able to have not one queue?

class Pool { // eslint-disable-line no-unused-vars
  constructor(processor) {
    this.queue = [];
    this.generation = 0;
    this.freeWorkers = [];
    this.workers = {};
    this.processor = processor;
    const capacity = navigator.hardwareConcurrency || 4;
    for (let i = 0; i < capacity; i++) {
      const w = new Worker(`worker.js?${Math.random()}`); // Hmm...
      w.onmessage = ((pool) => (e) => {
        pool.obtainResult(e.data);
      })(this);
      const worker = {
        worker: w,
        id: i,
      };
      this.workers[i] = worker;
      this.freeWorkers.push(worker);
    }
  }

  setQueue(tasks) {
    // invalidate all running (outdated) tasks; yes, we don't stop them, just drop results
    this.generation++;
    this.queue = [...tasks]; // clone array to avoid side effect
    this.kick();
  }

  kick() { // private
    while (this.freeWorkers.length > 0 && this.queue.length > 0) {
      const worker = this.freeWorkers.pop();
      const task = this.queue.pop();
      worker.worker.postMessage({
        task,
        generation: this.generation,
        id: worker.id,
      });
    }
  }

  obtainResult(data) {
    this.freeWorkers.push(this.workers[data.id]);
    this.kick();
    if (data.generation !== this.generation) {
      console.log('drop outdated', data.generation, this.generation);
      return;
    }
    this.processor.process(data.task, data.result);
  }
}
