"""
⏰ Autonomous Job Scheduler
Lightweight cron-like job runner with health monitoring.
Registers jobs, runs them on intervals, tracks status.
Uses threading for concurrent job execution.
"""

import threading
import time
from datetime import datetime, timezone
from typing import Callable, Optional


class Job:
    """Represents a single scheduled job."""

    def __init__(self, name: str, fn: Callable, interval_sec: float):
        self.name = name
        self.fn = fn
        self.interval_sec = interval_sec
        self._timer: Optional[threading.Timer] = None
        self._running = False
        self.stats = {
            "runs_completed": 0,
            "runs_failed": 0,
            "last_run": None,
            "last_duration_ms": 0,
            "last_error": None,
            "is_active": False,
        }

    def _execute(self):
        """Execute the job and update stats."""
        start = time.time()
        try:
            self.fn()
            self.stats["runs_completed"] += 1
            self.stats["last_error"] = None
        except Exception as e:
            self.stats["runs_failed"] += 1
            self.stats["last_error"] = str(e)
            print(f"[Scheduler] ❌ Job '{self.name}' failed: {e}")
        self.stats["last_run"] = datetime.now(timezone.utc).isoformat()
        self.stats["last_duration_ms"] = int((time.time() - start) * 1000)

    def _loop(self):
        """Execute and re-schedule."""
        if not self._running:
            return
        self._execute()
        self._timer = threading.Timer(self.interval_sec, self._loop)
        self._timer.daemon = True
        self._timer.start()

    def start(self):
        self._running = True
        self.stats["is_active"] = True
        # Run immediately in a background thread
        self._timer = threading.Timer(0, self._loop)
        self._timer.daemon = True
        self._timer.start()

    def stop(self):
        self._running = False
        self.stats["is_active"] = False
        if self._timer:
            self._timer.cancel()
            self._timer = None


class Scheduler:
    """Lightweight job scheduler with health monitoring."""

    def __init__(self):
        self.jobs: dict[str, Job] = {}
        self.is_running = False
        self.started_at: Optional[str] = None

    def register(self, name: str, fn: Callable, interval_sec: float):
        """Register a job."""
        if name in self.jobs:
            print(f"[Scheduler] ⚠️  Job '{name}' already registered, overwriting.")
            self.unregister(name)
        self.jobs[name] = Job(name, fn, interval_sec)
        print(f"[Scheduler] 📋 Registered job: '{name}' (every {interval_sec:.0f}s)")

    def unregister(self, name: str):
        """Unregister and stop a job."""
        if name in self.jobs:
            self.jobs[name].stop()
            del self.jobs[name]

    def start_all(self):
        """Start all registered jobs."""
        self.is_running = True
        self.started_at = datetime.now(timezone.utc).isoformat()
        for job in self.jobs.values():
            job.start()
        print(f"[Scheduler] 🚀 Started {len(self.jobs)} jobs")

    def stop_all(self):
        """Stop all running jobs."""
        for job in self.jobs.values():
            job.stop()
        self.is_running = False
        print("[Scheduler] 🛑 All jobs stopped")

    def trigger_job(self, name: str) -> dict:
        """Manually trigger a specific job."""
        if name not in self.jobs:
            raise KeyError(f"Job '{name}' not found")
        self.jobs[name]._execute()
        return self.jobs[name].stats

    def get_status(self) -> dict:
        """Get status of all jobs (dashboard-ready)."""
        jobs_status = {}
        for name, job in self.jobs.items():
            jobs_status[name] = {
                "interval_sec": job.interval_sec,
                "interval_human": f"{job.interval_sec:.0f}s",
                **job.stats,
            }
        return {
            "is_running": self.is_running,
            "started_at": self.started_at,
            "total_jobs": len(self.jobs),
            "jobs": jobs_status,
        }
