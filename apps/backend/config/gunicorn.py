"""Prometheus worker lifecycle integration; entrypoint prepares storage."""

from prometheus_client import multiprocess


def child_exit(server, worker):
    multiprocess.mark_process_dead(worker.pid)
