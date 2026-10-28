"""Prometheus worker lifecycle integration; entrypoint prepares storage."""

from prometheus_client import multiprocess


def child_exit(server, worker):
    multiprocess.mark_process_dead(worker.pid)


def post_fork(server, worker):
    from config.tracing import setup_tracing

    setup_tracing()


def worker_exit(server, worker):
    from config.tracing import shutdown_tracing

    shutdown_tracing()
