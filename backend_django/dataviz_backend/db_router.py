import threading
from django.db import connections

_thread_locals = threading.local()

def is_supabase_online():
    """
    Check if the Supabase Postgres database is reachable.
    Cached for 5 seconds to prevent performance overhead.
    """
    import time
    from django.db.utils import OperationalError
    
    # Initialize cache if not present
    if not hasattr(_thread_locals, 'supabase_online_cache'):
        _thread_locals.supabase_online_cache = {
            'status': True,
            'last_checked': 0
        }
        
    cache = _thread_locals.supabase_online_cache
    now = time.time()
    if now - cache['last_checked'] < 5:
        return cache['status']
        
    if 'supabase' not in connections:
        cache['status'] = False
        cache['last_checked'] = now
        return False
        
    try:
        connections['supabase'].ensure_connection()
        cache['status'] = True
    except (OperationalError, Exception):
        cache['status'] = False
        
    cache['last_checked'] = now
    return cache['status']


class DualDatabaseRouter:
    """
    A database router to dynamically route database operations
    between Supabase (primary) and SQLite (offline secondary).
    """
    def db_for_read(self, model, **hints):
        if getattr(_thread_locals, 'force_database', None):
            return _thread_locals.force_database
        if is_supabase_online():
            return 'supabase'
        return 'sqlite'

    def db_for_write(self, model, **hints):
        if getattr(_thread_locals, 'force_database', None):
            return _thread_locals.force_database
        if is_supabase_online():
            return 'supabase'
        return 'sqlite'

    def allow_relation(self, obj1, obj2, **hints):
        return True

    def allow_migrate(self, db, app_label, model_name=None, **hints):
        return True


from contextlib import contextmanager

@contextmanager
def force_db(db_name):
    """Context manager to temporarily force the database routing to a specific connection."""
    previous = getattr(_thread_locals, 'force_database', None)
    _thread_locals.force_database = db_name
    try:
        yield
    finally:
        _thread_locals.force_database = previous
